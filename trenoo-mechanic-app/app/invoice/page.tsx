"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { FileText, Plus, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  carrier: string;
  unit: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
}

const MOCK_INVOICES: InvoiceItem[] = [
  {
    id: "inv-1",
    invoiceNo: "INV-2026-081",
    carrier: "Midwest Freight Line",
    unit: "TRK-8812 (Peterbilt 579)",
    amount: 1450.0,
    date: "Oct 12, 2026",
    status: "paid",
  },
  {
    id: "inv-2",
    invoiceNo: "INV-2026-082",
    carrier: "California Cold Transport",
    unit: "TRL-4091 (Great Dane Reefer)",
    amount: 1120.0,
    date: "Oct 12, 2026",
    status: "pending",
  },
  {
    id: "inv-3",
    invoiceNo: "INV-2026-083",
    carrier: "Western Logistics Corp",
    unit: "TRL-1102 (Dry Van Trailer)",
    amount: 640.0,
    date: "Oct 10, 2026",
    status: "paid",
  },
  {
    id: "inv-4",
    invoiceNo: "INV-2026-084",
    carrier: "Apex Interstate Carriers",
    unit: "TRK-5540 (Freightliner Cascadia)",
    amount: 2180.0,
    date: "Oct 08, 2026",
    status: "overdue",
  },
];

export default function InvoicePage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F96176]">
              <FileText size={14} />
              <span>Financial Ledger</span>
            </div>
            <h1 className="text-3xl font-black text-[#0B132B] mt-1">
              Fleet Invoices & Statements
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage accounts receivable, parts billing, and commercial labor rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Create Invoice dialog opened.")}
              className="px-4 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Invoice Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-bold uppercase">Total Invoiced (MTD)</span>
            <div className="text-2xl font-black text-[#0B132B] mt-1">$48,920.00</div>
            <span className="text-xs text-[#58BB87] font-semibold">32 Invoices Issued</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-bold uppercase">Pending Payments</span>
            <div className="text-2xl font-black text-amber-600 mt-1">$12,450.00</div>
            <span className="text-xs text-amber-600 font-semibold">6 Awaiting Carrier Wire</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-bold uppercase">Paid & Cleared</span>
            <div className="text-2xl font-black text-[#58BB87] mt-1">$36,470.00</div>
            <span className="text-xs text-[#58BB87] font-semibold">Direct Deposit Processed</span>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6">
          <h3 className="text-lg font-black text-[#0B132B] mb-4">
            Recent Fleet Statements
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Fleet Carrier</th>
                  <th className="py-3 px-4">Unit Serviced</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F96176]">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {inv.carrier}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {inv.unit}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {inv.date}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#0B132B]">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                          inv.status === "paid"
                            ? "bg-[#EAF8F1] text-[#58BB87]"
                            : inv.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading ${inv.invoiceNo}.pdf`)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0B132B] hover:text-white transition text-gray-600"
                        title="Download Invoice"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
