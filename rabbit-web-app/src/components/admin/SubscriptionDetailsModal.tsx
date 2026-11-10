"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  CreditCard,
  User,
  Wrench,
  Truck,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Building,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { SubscriptionPurchaseRecord } from "@/types/subscription";

interface SubscriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: SubscriptionPurchaseRecord | null;
  formatDate: (val: any) => string;
  renewalDate: Date | null;
  daysRemaining: number | null;
}

export default function SubscriptionDetailsModal({
  isOpen,
  onClose,
  subscriber,
  formatDate,
  renewalDate,
  daysRemaining,
}: SubscriptionDetailsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !subscriber) return null;

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isMechanic = subscriber.userType === "mechanic";
  const isDriver = subscriber.userType === "driver" || subscriber.userType === "owner";

  const isExpiringSoon =
    daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isMechanic
                  ? "bg-rose-50 text-[#F96176] border border-rose-100"
                  : "bg-emerald-50 text-[#58BB87] border border-emerald-100"
              }`}
            >
              {isMechanic ? <Wrench className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Subscription Purchase Details
                </h2>
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    isMechanic
                      ? "bg-rose-50 text-[#F96176] border border-rose-200"
                      : "bg-emerald-50 text-[#58BB87] border border-emerald-200"
                  }`}
                >
                  {isMechanic ? "Mechanic" : "Driver / Fleet Owner"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Reference ID: <span className="font-mono text-gray-700">{subscriber.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Top Status & Plan Highlight */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Purchased Plan
              </span>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                {subscriber.planName}
              </h3>
              <p className="text-xs text-gray-600 font-medium flex items-center gap-2">
                <span>Billing: <b>{subscriber.duration}</b></span>
                <span>•</span>
                <span className="text-[#58BB87] font-bold">
                  {subscriber.autoPay ? "Auto-Pay Active" : "Manual Billing"}
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Amount Paid
              </span>
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                ${subscriber.amountPaid?.toFixed(2)}{" "}
                <span className="text-xs font-bold text-gray-500">
                  {subscriber.currency?.toUpperCase() || "USD"}
                </span>
              </div>
              {subscriber.originalPrice && subscriber.originalPrice > subscriber.amountPaid && (
                <span className="text-xs line-through text-gray-400">
                  Regular ${subscriber.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Validity & Renewal Cards (MM/DD/YYYY) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Start Date */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F96176]" />
                Purchased On
              </span>
              <div className="text-base font-extrabold text-gray-900">
                {formatDate(subscriber.purchasedAt || subscriber.purchasedTimestamp)}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">MM/DD/YYYY format</span>
            </div>

            {/* Next Renewal */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-[#58BB87]" />
                Next Renewal
              </span>
              <div className="text-base font-extrabold text-gray-900">
                {renewalDate ? formatDate(renewalDate) : "N/A"}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">
                {subscriber.autoPay ? "Auto-debit scheduled" : "Expiry cutoff"}
              </span>
            </div>

            {/* Remaining Days */}
            <div
              className={`p-4 rounded-2xl border space-y-1 ${
                isExpired
                  ? "bg-red-50/50 border-red-200"
                  : isExpiringSoon
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-600" />
                Remaining
              </span>
              <div
                className={`text-base font-extrabold ${
                  isExpired
                    ? "text-red-700"
                    : isExpiringSoon
                    ? "text-amber-700"
                    : "text-gray-900"
                }`}
              >
                {daysRemaining !== null
                  ? daysRemaining > 0
                    ? `${daysRemaining} Days Left`
                    : "Expired"
                  : "Active"}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                Status: {subscriber.status || "active"}
              </span>
            </div>
          </div>

          {/* Subscriber Profile Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3.5">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-4 h-4 text-[#F96176]" />
              Subscriber Contact Profile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 font-medium block">Subscriber Name:</span>
                <span className="text-gray-900 font-bold text-sm">
                  {subscriber.userName || "Registered Member"}
                </span>
              </div>

              {subscriber.businessName && (
                <div>
                  <span className="text-gray-500 font-medium block">
                    {isMechanic ? "Workshop Name:" : "Company Name:"}
                  </span>
                  <span className="text-gray-900 font-bold text-sm">
                    {subscriber.businessName}
                  </span>
                </div>
              )}

              <div>
                <span className="text-gray-500 font-medium block">Email:</span>
                <a
                  href={`mailto:${subscriber.userEmail}`}
                  className="text-[#F96176] font-semibold hover:underline"
                >
                  {subscriber.userEmail}
                </a>
              </div>

              {subscriber.userPhone && (
                <div>
                  <span className="text-gray-500 font-medium block">Phone:</span>
                  <span className="text-gray-900 font-semibold">{subscriber.userPhone}</span>
                </div>
              )}

              {subscriber.userLocation && (
                <div className="sm:col-span-2">
                  <span className="text-gray-500 font-medium block">Location:</span>
                  <span className="text-gray-800 font-medium">{subscriber.userLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Plan Limits & Entitlements */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3.5">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
              <ShieldCheck className="w-4 h-4 text-[#58BB87]" />
              Included Plan Entitlements & Capacity
            </h4>

            {isMechanic ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Service Bays</span>
                  <span className="text-gray-900 font-extrabold text-sm">
                    {subscriber.maxBays === -1 || subscriber.maxBays === undefined
                      ? "Unlimited"
                      : `${subscriber.maxBays} Bays`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Dispatch Radius</span>
                  <span className="text-gray-900 font-extrabold text-sm">
                    {subscriber.serviceRadiusMiles === -1 || subscriber.serviceRadiusMiles === undefined
                      ? "Nationwide"
                      : `${subscriber.serviceRadiusMiles} Miles`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Priority Leads</span>
                  <span className="text-[#58BB87] font-extrabold text-sm">
                    {subscriber.priorityJobLeads !== false ? "Active" : "Standard"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Carrier Invoicing</span>
                  <span className="text-[#58BB87] font-extrabold text-sm">
                    {subscriber.directCarrierInvoicing !== false ? "Enabled" : "Manual"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Max Vehicles</span>
                  <span className="text-gray-900 font-extrabold text-sm">
                    {subscriber.maxVehicles === -1 || subscriber.maxVehicles === undefined
                      ? "Unlimited"
                      : subscriber.maxVehicles}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Truck Limit</span>
                  <span className="text-gray-900 font-extrabold text-sm">
                    {subscriber.truckLimit === -1 || subscriber.truckLimit === undefined
                      ? "Unlimited"
                      : subscriber.truckLimit}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Trailer Limit</span>
                  <span className="text-gray-900 font-extrabold text-sm">
                    {subscriber.trailerLimit === -1 || subscriber.trailerLimit === undefined
                      ? "Unlimited"
                      : subscriber.trailerLimit}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Vehicle Scope</span>
                  <span className="text-gray-900 font-extrabold text-sm capitalize">
                    {subscriber.vehicleTypeScope || "Both"}
                  </span>
                </div>
              </div>
            )}

            {/* Feature tags */}
            {subscriber.features && subscriber.features.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Plan Feature Highlights:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subscriber.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#58BB87] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stripe Gateway Transaction Metadata */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                Stripe Payment Gateway Identifiers
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                Auto-Pay Enabled
              </span>
            </h4>

            <div className="space-y-2 text-xs">
              {subscriber.stripeSubscriptionId && (
                <div className="flex items-center justify-between py-1 bg-white px-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 font-medium">Stripe Subscription ID:</span>
                  <div className="flex items-center gap-1.5 font-mono text-gray-800">
                    <span>{subscriber.stripeSubscriptionId}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(subscriber.stripeSubscriptionId!, "stripeSub")
                      }
                      className="p-1 text-gray-400 hover:text-gray-700 transition"
                      title="Copy ID"
                    >
                      {copiedKey === "stripeSub" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {subscriber.stripeCustomerId && (
                <div className="flex items-center justify-between py-1 bg-white px-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 font-medium">Stripe Customer ID:</span>
                  <div className="flex items-center gap-1.5 font-mono text-gray-800">
                    <span>{subscriber.stripeCustomerId}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(subscriber.stripeCustomerId!, "stripeCust")
                      }
                      className="p-1 text-gray-400 hover:text-gray-700 transition"
                      title="Copy ID"
                    >
                      {copiedKey === "stripeCust" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {subscriber.stripeInvoiceId && (
                <div className="flex items-center justify-between py-1 bg-white px-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 font-medium">Stripe Invoice ID:</span>
                  <div className="flex items-center gap-1.5 font-mono text-gray-800">
                    <span>{subscriber.stripeInvoiceId}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(subscriber.stripeInvoiceId!, "stripeInv")
                      }
                      className="p-1 text-gray-400 hover:text-gray-700 transition"
                      title="Copy ID"
                    >
                      {copiedKey === "stripeInv" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-1 bg-white px-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-medium">Subscriber User UID:</span>
                <div className="flex items-center gap-1.5 font-mono text-gray-800">
                  <span>{subscriber.userId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(subscriber.userId, "userId")}
                    className="p-1 text-gray-400 hover:text-gray-700 transition"
                    title="Copy UID"
                  >
                    {copiedKey === "userId" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            {isMechanic ? (
              <Link
                href={`/admin/mechanics`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F96176] hover:underline"
              >
                <span>View All Mechanics</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href={`/admin/users`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#58BB87] hover:underline"
              >
                <span>View All Users</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}