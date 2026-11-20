"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  Truck,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
  DollarSign,
  AlertCircle,
  XCircle,
  RefreshCw,
  X,
  CreditCard,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { CustomFleetPlanRequest } from "@/types/subscription";

export default function CustomPlanRequestsManager() {
  const [requests, setRequests] = useState<CustomFleetPlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Quote Modal state
  const [selectedReq, setSelectedReq] = useState<CustomFleetPlanRequest | null>(null);
  const [quotedAmount, setQuotedAmount] = useState<string>("");
  const [quotedDuration, setQuotedDuration] = useState<"Monthly" | "Yearly">("Monthly");
  const [quotedCurrency, setQuotedCurrency] = useState<string>("USD");
  const [paymentLink, setPaymentLink] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [sendingQuote, setSendingQuote] = useState(false);

  // 1. Subscribe to vehicleCustomPlanRequests in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "vehicleCustomPlanRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: CustomFleetPlanRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...(docSnap.data() as any),
          });
        });
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading custom plan requests:", err);
        toast.error("Failed to load requests from database");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchStatus = statusFilter === "all" || req.status === statusFilter;
      const qLower = searchQuery.toLowerCase().trim();
      const matchSearch =
        !qLower ||
        req.companyName?.toLowerCase().includes(qLower) ||
        req.userEmail?.toLowerCase().includes(qLower) ||
        req.contactNumber?.includes(qLower) ||
        req.country?.toLowerCase().includes(qLower);

      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  // Statistics
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const quotedCount = requests.filter((r) => r.status === "quoted").length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

  const handleOpenQuoteModal = (req: CustomFleetPlanRequest) => {
    setSelectedReq(req);
    setQuotedAmount(req.quotedAmount ? String(req.quotedAmount) : "");
    setQuotedDuration(req.quotedDuration || req.preferredBilling || "Monthly");
    setPaymentLink(req.stripePaymentLink || "");
    setAdminNotes(req.adminNotes || "");
    setQuotedCurrency(req.country === "Canada" ? "CAD" : req.country === "Mexico" ? "MXN" : "USD");
  };

  const handleUpdateStatus = async (reqId: string, newStatus: CustomFleetPlanRequest["status"]) => {
    try {
      await updateDoc(doc(db, "vehicleCustomPlanRequests", reqId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Request marked as ${newStatus}`);
    } catch (err: any) {
      console.error("Error updating request status:", err);
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !selectedReq.id) return;

    const amountNum = parseFloat(quotedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid quoted amount");
      return;
    }

    setSendingQuote(true);
    try {
      // 1. Call API route to send email
      const res = await fetch("/api/custom-plan-quote/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedReq.id,
          toEmail: selectedReq.userEmail,
          companyName: selectedReq.companyName,
          quotedAmount: amountNum,
          quotedDuration,
          currency: quotedCurrency,
          paymentLink: paymentLink.trim() || undefined,
          adminNotes: adminNotes.trim() || undefined,
          requestedFleet: {
            trucks: selectedReq.requestedTrucks,
            trailers: selectedReq.requestedTrailers,
            totalUnits: selectedReq.totalUnits,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch email");
      }

      // 2. Update Firestore document
      await updateDoc(doc(db, "vehicleCustomPlanRequests", selectedReq.id), {
        status: "quoted",
        quotedAmount: amountNum,
        quotedDuration,
        stripePaymentLink: paymentLink.trim() || null,
        adminNotes: adminNotes.trim() || null,
        quotedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Quote successfully dispatched to ${selectedReq.userEmail}!`);
      setSelectedReq(null);
    } catch (err: any) {
      console.error("Error dispatching quote:", err);
      toast.error(err?.message || "Failed to send quote. Please try again.");
    } finally {
      setSendingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#F96176] shadow-md shadow-[#F96176]/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Custom Fleet Plan Requests</h1>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-[#F96176] border border-rose-200 animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Review tailored fleet requirements, dispatch personalized quotes with Stripe payment links, or add new slabs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/subscription-plans/owners-drivers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-[#F96176] hover:text-[#F96176] transition shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#F96176]" />
            <span>Manage Owner Slabs</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Leads</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{requests.length}</p>
        </div>

        <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-[#F96176] uppercase tracking-wider">Pending Quotes</span>
          <p className="text-2xl font-black text-[#F96176] mt-1">{pendingCount}</p>
        </div>

        <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Quotes Sent</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{quotedCount}</p>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-[#58BB87] uppercase tracking-wider">Completed / Active</span>
          <p className="text-2xl font-black text-[#58BB87] mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: "all", label: `All (${requests.length})` },
            { key: "pending", label: `Pending (${pendingCount})` },
            { key: "quoted", label: `Quoted (${quotedCount})` },
            { key: "completed", label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === tab.key
                  ? "bg-[#F96176] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, email, phone..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Loading custom fleet requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#F96176] flex items-center justify-center mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Custom Plan Requests</h3>
          <p className="text-xs text-gray-500 mt-1">
            When users request tailored fleet pricing outside pre-set slabs, their inquiries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === "pending";
            const isQuoted = req.status === "quoted";
            const isCompleted = req.status === "completed";

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isPending
                    ? "border-rose-200 hover:border-rose-300"
                    : isQuoted
                    ? "border-amber-200 hover:border-amber-300"
                    : isCompleted
                    ? "border-emerald-200 hover:border-emerald-300"
                    : "border-gray-200"
                }`}
              >
                {/* Request Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-black text-gray-900">
                      {req.companyName}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPending
                          ? "bg-rose-100 text-[#F96176] border border-rose-200"
                          : isQuoted
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : isCompleted
                          ? "bg-emerald-100 text-[#58BB87] border border-emerald-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isPending && <Clock className="w-3 h-3" />}
                      {isQuoted && <Send className="w-3 h-3" />}
                      {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      {req.status}
                    </span>

                    {/* Billing Preference */}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono">
                      {req.preferredBilling} Invoicing
                    </span>

                    <span className="text-[11px] font-bold text-gray-400">
                      &bull; {req.country}
                    </span>
                  </div>

                  {/* Fleet Units Badge Grid */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-100 text-xs text-gray-800">
                      <Truck className="w-3.5 h-3.5 text-[#F96176]" />
                      <span>
                        <strong>{req.requestedTrucks}</strong> Trucks + <strong>{req.requestedTrailers}</strong> Trailers
                      </span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-md bg-[#F96176] text-white font-extrabold text-[10px]">
                        {req.totalUnits} Units Total
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{req.userEmail}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{req.contactNumber}</span>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {req.notes && (
                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-200/70 text-xs text-gray-600">
                      <span className="font-bold text-gray-700">Client Requirements: </span>
                      <span className="italic">&quot;{req.notes}&quot;</span>
                    </div>
                  )}

                  {/* Quoted Information Banner if already quoted */}
                  {isQuoted && req.quotedAmount && (
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#58BB87]" />
                        <span>
                          Quoted Offer: <strong>${req.quotedAmount}</strong> / {req.quotedDuration || "Monthly"}
                        </span>
                      </div>
                      {req.stripePaymentLink && (
                        <a
                          href={req.stripePaymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#58BB87] hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>View Payment Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenQuoteModal(req)}
                    className="px-4 py-2 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold transition shadow-sm shadow-[#F96176]/25 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isQuoted ? "Update Quote" : "Send Quote Email"}</span>
                  </button>

                  {/* Status Dropdown / Action */}
                  <div className="flex items-center gap-1.5">
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id!, "completed")}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition flex items-center justify-center gap-1"
                        title="Mark as Active / Completed"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Paid</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id!, "pending")}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      >
                        <span>Reopen</span>
                      </button>
                    )}

                    <Link
                      href="/admin/subscription-plans/owners-drivers"
                      className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#58BB87] hover:text-[#58BB87] text-[11px] font-bold transition flex items-center justify-center gap-1"
                      title="Create a permanent slab for this tier"
                    >
                      <span>Add Slab</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote Dispatch Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-rose-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-50 via-white to-emerald-50 border-b border-rose-100 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F96176] bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Dispatch Custom Offer
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1">
                  Send Quote to {selectedReq.companyName}
                </h3>
                <p className="text-xs text-gray-500">
                  Target Fleet: {selectedReq.totalUnits} Units ({selectedReq.requestedTrucks} Trucks &bull; {selectedReq.requestedTrailers} Trailers)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSendQuote} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Quoted Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Quoted Price ({quotedCurrency}) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#F96176] focus-within:border-transparent">
                    <span className="text-gray-400 font-bold mr-2 text-sm">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={quotedAmount}
                      onChange={(e) => setQuotedAmount(e.target.value)}
                      placeholder="e.g. 75.00"
                      className="w-full text-sm font-black text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Billing Interval
                  </label>
                  <select
                    value={quotedDuration}
                    onChange={(e) => setQuotedDuration(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#F96176] outline-none"
                  >
                    <option value="Monthly">Monthly Invoicing</option>
                    <option value="Yearly">Yearly Contract</option>
                  </select>
                </div>
              </div>

              {/* Stripe Payment Link (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Stripe Payment Link (Optional)
                </label>
                <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#58BB87] focus-within:border-transparent">
                  <CreditCard className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    value={paymentLink}
                    onChange={(e) => setPaymentLink(e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                    className="w-full text-xs font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Paste a direct Stripe checkout link generated from your Stripe Dashboard for immediate credit card payment.
                </p>
              </div>

              {/* Account Manager Notes for Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Account Manager Note to Client
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Included all 12 power units with 24/7 priority technician support and 10% volume discount."
                  className="w-full p-3 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#F96176] outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  disabled={sendingQuote}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sendingQuote}
                  className="px-6 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold transition shadow-md shadow-[#F96176]/25 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {sendingQuote ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Quote to {selectedReq.userEmail}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
