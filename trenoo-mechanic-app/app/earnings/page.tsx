"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  JobSettlement,
  describeCommission,
  summarizeSettlements,
} from "@/lib/commission";
import { isTeamMemberProfile } from "@/lib/jobWorkflow";

const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n || 0);

type StatusFilter = "all" | "pending" | "settled";

export default function EarningsPage() {
  const auth = useAuth();
  const uid = auth?.user?.uid || "";
  const isMember = isTeamMemberProfile(auth?.mechanicProfile);

  const [rows, setRows] = useState<JobSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Settlements are filed under the workshop owner (team members are paid by their owner)
  useEffect(() => {
    if (!uid || isMember) return;
    const q = query(collection(db, "jobSettlements"), where("workshopOwnerId", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as JobSettlement), id: d.id }));
        list.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
        setRows(list);
        setLoading(false);
      },
      (err) => {
        console.error("jobSettlements listener error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid, isMember]);

  const summary = useMemo(() => summarizeSettlements(rows), [rows]);
  const visible = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter]
  );

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="pb-5 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
            <Wallet size={14} />
            <span>Earnings & Settlements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Job Earnings & Platform Commission
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-3xl">
            Commission comes from your subscription plan and is applied to each work order
            once the customer signs off. Online payments are collected by the platform and paid
            out to you; on cash jobs you collected the money, so the platform&apos;s service fee
            and commission are owed back.
          </p>
        </div>

        {isMember ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
            Earnings and settlements are managed by your workshop owner.
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Completed jobs" value={String(summary.jobs)} />
              <Kpi label="Work order volume" value={money(summary.workOrderVolume)} />
              <Kpi label="Your net earnings" value={money(summary.mechanicNet)} tone="green" />
              <Kpi
                label={summary.netPosition >= 0 ? "Net payout due to you" : "Net amount you owe"}
                value={money(Math.abs(summary.netPosition))}
                tone={summary.netPosition >= 0 ? "green" : "rose"}
                hint={`Platform owes ${money(summary.pendingPlatformOwes)} · You owe ${money(
                  summary.pendingMechanicOwes
                )}`}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              {(["all", "pending", "settled"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    statusFilter === f
                      ? "bg-[#F96176] text-white border-[#F96176]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f === "all" ? "All" : f === "pending" ? "Pending settlement" : "Settled"}
                </button>
              ))}
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
              {loading ? (
                <div className="py-14 flex flex-col items-center gap-2 text-gray-400 text-xs font-semibold">
                  <RefreshCw size={20} className="animate-spin text-[#F96176]" />
                  Loading settlements...
                </div>
              ) : visible.length === 0 ? (
                <div className="py-14 text-center text-sm text-gray-500">
                  No settlements yet. They appear when customers sign off completed jobs.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="text-left py-3 px-4">Job</th>
                      <th className="text-left py-3 px-4">Technician</th>
                      <th className="text-right py-3 px-4">Work order</th>
                      <th className="text-right py-3 px-4">Commission</th>
                      <th className="text-right py-3 px-4">Net earning</th>
                      <th className="text-left py-3 px-4">Paid via</th>
                      <th className="text-left py-3 px-4">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">#{r.orderId}</div>
                          <div className="text-gray-500">{r.selectedService}</div>
                          <div className="text-gray-400 text-[10px]">
                            {r.completedAt ? new Date(r.completedAt).toLocaleString() : ""}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{r.technicianName || "—"}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {money(r.workOrderAmount, r.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                          −{money(r.mechanicCommission, r.currency)}
                          <div className="text-[10px] text-gray-400 font-medium">
                            {describeCommission(r.mechanicCommissionRule)}
                            {r.mechanicCommissionRule?.planName
                              ? ` · ${r.mechanicCommissionRule.planName}`
                              : ""}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#58BB87]">
                          {money(r.mechanicNetEarning, r.currency)}
                        </td>
                        <td className="py-3 px-4 uppercase font-semibold text-gray-700">
                          {r.payMode}
                        </td>
                        <td className="py-3 px-4">
                          <BalanceBadge row={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function Kpi({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "green" | "rose";
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div
        className={`text-xl font-black mt-1 ${
          tone === "green" ? "text-[#58BB87]" : tone === "rose" ? "text-rose-600" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-[10px] text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

function BalanceBadge({ row }: { row: JobSettlement }) {
  if (row.status === "settled") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
        <CheckCircle2 size={11} /> Settled
      </span>
    );
  }
  const owedToYou = row.direction === "platform_owes_mechanic";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border font-semibold ${
        owedToYou
          ? "bg-sky-50 text-sky-800 border-sky-200"
          : "bg-amber-50 text-amber-800 border-amber-200"
      }`}
    >
      {owedToYou ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
      {owedToYou ? "Payout due" : "You owe"} {money(row.balanceDue, row.currency)}
      <Clock size={10} className="opacity-60" />
    </span>
  );
}
