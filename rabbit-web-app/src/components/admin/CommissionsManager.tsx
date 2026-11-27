"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Percent,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import {
  JobSettlement,
  describeCommission,
  roundMoney,
  summarizeSettlements,
} from "@/lib/commission";
import { recordJobSettlement } from "@/lib/services/commissionService";
import type { HistoryItem } from "@/types/types";

const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n || 0);

type StatusFilter = "all" | "pending" | "settled";
type DirectionFilter = "all" | "platform_owes_mechanic" | "mechanic_owes_platform";

interface WorkshopBalance {
  workshopOwnerId: string;
  workshopName: string;
  jobs: number;
  owedToWorkshop: number;
  owedByWorkshop: number;
  net: number;
  pendingIds: string[];
}

export default function CommissionsManager() {
  const auth = useAuth();
  const adminLabel = auth?.user?.email || auth?.user?.uid || "admin";

  const [rows, setRows] = useState<JobSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [missing, setMissing] = useState<Array<{ id: string; job: HistoryItem }>>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "jobSettlements"),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as JobSettlement), id: d.id }));
        list.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
        setRows(list);
        setLoading(false);
      },
      (err) => {
        console.error("jobSettlements listener error:", err);
        toast.error("Could not load settlements (check Firestore rules for jobSettlements).");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const summary = useMemo(() => summarizeSettlements(rows), [rows]);
  const feeTotals = useMemo(
    () => ({
      customerFees: roundMoney(rows.reduce((t, r) => t + r.customerServiceFee, 0)),
      mechanicCommissions: roundMoney(rows.reduce((t, r) => t + r.mechanicCommission, 0)),
    }),
    [rows]
  );

  const balances = useMemo<WorkshopBalance[]>(() => {
    const map = new Map<string, WorkshopBalance>();
    for (const r of rows) {
      const b =
        map.get(r.workshopOwnerId) ||
        ({
          workshopOwnerId: r.workshopOwnerId,
          workshopName: r.workshopName || r.workshopOwnerId,
          jobs: 0,
          owedToWorkshop: 0,
          owedByWorkshop: 0,
          net: 0,
          pendingIds: [],
        } as WorkshopBalance);
      b.jobs += 1;
      if (r.status === "pending") {
        if (r.direction === "platform_owes_mechanic") b.owedToWorkshop += r.balanceDue;
        else b.owedByWorkshop += r.balanceDue;
        b.pendingIds.push(r.id);
      }
      map.set(r.workshopOwnerId, b);
    }
    return Array.from(map.values())
      .map((b) => ({
        ...b,
        owedToWorkshop: roundMoney(b.owedToWorkshop),
        owedByWorkshop: roundMoney(b.owedByWorkshop),
        net: roundMoney(b.owedToWorkshop - b.owedByWorkshop),
      }))
      .filter((b) => b.pendingIds.length > 0)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (directionFilter !== "all" && r.direction !== directionFilter) return false;
      if (!q) return true;
      return [r.orderId, r.workshopName, r.technicianName, r.customerName, r.selectedService]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, statusFilter, directionFilter, search]);

  const markSettled = async (ids: string[], label: string) => {
    if (ids.length === 0 || busy) return;
    const note = window.prompt(
      `Mark ${ids.length} settlement(s) as settled for ${label}?\nOptional reference (payout ID, cheque no., UPI/ACH ref):`,
      ""
    );
    if (note === null) return;
    setBusy(true);
    try {
      const settledAt = new Date().toISOString();
      for (let i = 0; i < ids.length; i += 400) {
        const batch = writeBatch(db);
        ids.slice(i, i + 400).forEach((id) =>
          batch.update(doc(db, "jobSettlements", id), {
            status: "settled",
            settledAt,
            settledBy: adminLabel,
            settlementNote: note.trim() || null,
          })
        );
        await batch.commit();
      }
      toast.success(`${ids.length} settlement(s) marked settled.`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update settlements");
    } finally {
      setBusy(false);
    }
  };

  // Completed jobs that have no ledger entry (sign-off before this feature, or a failed write)
  const scanMissing = async () => {
    setScanning(true);
    try {
      const snap = await getDocs(query(collection(db, "jobs"), where("status", "==", 5)));
      const known = new Set(rows.map((r) => r.id));
      const list: Array<{ id: string; job: HistoryItem }> = [];
      snap.forEach((d) => {
        const job = { ...(d.data() as HistoryItem), id: d.id };
        const rawId = d.id.replace(/^#/, "");
        if (!job.settlementId && !known.has(rawId) && Number(job.finalDiagnosedAmount) > 0) {
          list.push({ id: d.id, job });
        }
      });
      setMissing(list);
      toast.success(
        list.length ? `${list.length} completed job(s) without a settlement` : "All completed jobs are settled in the ledger"
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not scan completed jobs.");
    } finally {
      setScanning(false);
    }
  };

  const generateMissing = async (items: Array<{ id: string; job: HistoryItem }>) => {
    if (items.length === 0 || busy) return;
    if (
      !window.confirm(
        `Create ledger entries for ${items.length} job(s)?\nRates come from what was locked on each job; missing workshop rates use the workshop's CURRENT plan. Jobs paid before service fees existed get no customer fee.`
      )
    ) {
      return;
    }
    setBusy(true);
    let ok = 0;
    for (const { id, job } of items) {
      try {
        const created = await recordJobSettlement({
          jobId: id,
          job,
          customerId: job.ownerId || job.userId,
        });
        if (created) ok += 1;
      } catch (err) {
        console.error("Settlement generation failed for", id, err);
      }
    }
    setMissing((prev) => prev.filter((m) => !items.some((i) => i.id === m.id)));
    setBusy(false);
    toast.success(`Created ${ok} of ${items.length} settlement(s).`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
          <Percent size={14} />
          <span>Revenue</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Commissions & Settlements</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">
          One ledger entry per signed-off job. Online payments are held by the platform (pay
          the workshop its net earning); on cash jobs the workshop holds the money and owes the
          customer service fee + its commission.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Platform revenue" value={money(summary.platformRevenue)} tone="green" />
        <Kpi label="Customer service fees" value={money(feeTotals.customerFees)} />
        <Kpi label="Workshop commissions" value={money(feeTotals.mechanicCommissions)} />
        <Kpi label="Payouts due to workshops" value={money(summary.pendingPlatformOwes)} tone="sky" />
        <Kpi label="To collect from workshops" value={money(summary.pendingMechanicOwes)} tone="amber" />
      </div>

      {/* Per-workshop open balances */}
      <section className="bg-white rounded-2xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Wallet size={16} className="text-[#58BB87]" />
          <h2 className="text-sm font-bold text-gray-900">Open balances by workshop</h2>
        </div>
        {balances.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">No open balances.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Workshop</th>
                  <th className="text-right py-2.5 px-4">Pending jobs</th>
                  <th className="text-right py-2.5 px-4">Platform owes</th>
                  <th className="text-right py-2.5 px-4">Workshop owes</th>
                  <th className="text-right py-2.5 px-4">Net</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {balances.map((b) => (
                  <tr key={b.workshopOwnerId}>
                    <td className="py-2.5 px-4 font-semibold text-gray-900">{b.workshopName}</td>
                    <td className="py-2.5 px-4 text-right">{b.pendingIds.length}</td>
                    <td className="py-2.5 px-4 text-right text-sky-700">{money(b.owedToWorkshop)}</td>
                    <td className="py-2.5 px-4 text-right text-amber-700">{money(b.owedByWorkshop)}</td>
                    <td className={`py-2.5 px-4 text-right font-black ${b.net >= 0 ? "text-sky-700" : "text-amber-700"}`}>
                      {b.net >= 0 ? `Pay ${money(b.net)}` : `Collect ${money(-b.net)}`}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        disabled={busy}
                        onClick={() => markSettled(b.pendingIds, b.workshopName)}
                        className="px-3 py-1.5 rounded-lg bg-[#58BB87] hover:bg-[#48a674] text-white font-semibold disabled:opacity-50"
                      >
                        Settle all
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Missing settlements */}
      <section className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Completed jobs without a settlement</h2>
            <p className="text-xs text-gray-500">
              Jobs signed off before commissions existed, or where the ledger write failed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scanMissing}
              disabled={scanning || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={scanning ? "animate-spin" : ""} />
              Scan
            </button>
            {missing.length > 0 && (
              <button
                onClick={() => generateMissing(missing)}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-semibold disabled:opacity-50"
              >
                Generate {missing.length}
              </button>
            )}
          </div>
        </div>
        {missing.length > 0 && (
          <ul className="text-xs text-gray-700 grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {missing.map((m) => (
              <li key={m.id} className="px-2 py-1 rounded bg-gray-50 border border-gray-100">
                #{m.job.orderId || m.id} · {m.job.selectedService} · {money(Number(m.job.finalDiagnosedAmount))}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ledger */}
      <section className="bg-white rounded-2xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-bold text-gray-900 mr-auto">Ledger</h2>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order, workshop, technician..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
          >
            <option value="pending">Pending</option>
            <option value="settled">Settled</option>
            <option value="all">All statuses</option>
          </select>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
          >
            <option value="all">All directions</option>
            <option value="platform_owes_mechanic">Payouts (online)</option>
            <option value="mechanic_owes_platform">Collections (cash)</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-500 text-center">No settlements match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Job</th>
                  <th className="text-left py-2.5 px-4">Workshop / Tech</th>
                  <th className="text-right py-2.5 px-4">Work order</th>
                  <th className="text-right py-2.5 px-4">Customer fee</th>
                  <th className="text-right py-2.5 px-4">Commission</th>
                  <th className="text-right py-2.5 px-4">Charged</th>
                  <th className="text-right py-2.5 px-4">Platform</th>
                  <th className="text-left py-2.5 px-4">Balance</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 align-top">
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-gray-900">#{r.orderId}</div>
                      <div className="text-gray-500">{r.selectedService}</div>
                      <div className="text-[10px] text-gray-400">
                        {r.completedAt ? new Date(r.completedAt).toLocaleString() : ""} · {r.payMode.toUpperCase()}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-gray-800">{r.workshopName || r.workshopOwnerId}</div>
                      <div className="text-gray-500">{r.technicianName}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right">{money(r.workOrderAmount, r.currency)}</td>
                    <td className="py-2.5 px-4 text-right">
                      {money(r.customerServiceFee, r.currency)}
                      <div className="text-[10px] text-gray-400">{describeCommission(r.customerServiceFeeRule)}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {money(r.mechanicCommission, r.currency)}
                      <div className="text-[10px] text-gray-400">{describeCommission(r.mechanicCommissionRule)}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right">{money(r.totalCharged, r.currency)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-[#58BB87]">
                      {money(r.platformRevenue, r.currency)}
                    </td>
                    <td className="py-2.5 px-4">
                      {r.status === "settled" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 size={12} /> Settled
                          {r.settlementNote ? <span className="text-gray-400 font-normal">· {r.settlementNote}</span> : null}
                        </span>
                      ) : r.direction === "platform_owes_mechanic" ? (
                        <span className="inline-flex items-center gap-1 text-sky-700 font-semibold">
                          <ArrowUpRight size={12} /> Pay {money(r.balanceDue, r.currency)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <ArrowDownLeft size={12} /> Collect {money(r.balanceDue, r.currency)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {r.status === "pending" && (
                        <button
                          disabled={busy}
                          onClick={() => markSettled([r.id], `#${r.orderId}`)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 font-semibold disabled:opacity-50"
                        >
                          Mark settled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "green" | "sky" | "amber" }) {
  const color =
    tone === "green" ? "text-[#58BB87]" : tone === "sky" ? "text-sky-700" : tone === "amber" ? "text-amber-700" : "text-gray-900";
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-xl font-black mt-1 ${color}`}>{value}</div>
    </div>
  );
}
