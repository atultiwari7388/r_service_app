"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { CheckSquare, Plus, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CheckRecord {
  id: string;
  checkNo: string;
  payee: string;
  memo: string;
  amount: number;
  date: string;
  status: "cleared" | "printed" | "pending";
}

const MOCK_CHECKS: CheckRecord[] = [
  {
    id: "chk-1",
    checkNo: "CHK-10492",
    payee: "FleetPride Heavy Duty Parts",
    memo: "Air brake drums, slack adjusters & S-cam kits",
    amount: 3420.5,
    date: "Oct 12, 2026",
    status: "cleared",
  },
  {
    id: "chk-2",
    checkNo: "CHK-10493",
    payee: "Thermo King Central Valley",
    memo: "Reefer compressor belts & temperature probes",
    amount: 1840.0,
    date: "Oct 11, 2026",
    status: "printed",
  },
  {
    id: "chk-3",
    checkNo: "CHK-10494",
    payee: "Cummins Pacific Service Hub",
    memo: "X15 DPF differential sensor & injector set",
    amount: 4210.0,
    date: "Oct 09, 2026",
    status: "cleared",
  },
  {
    id: "chk-4",
    checkNo: "CHK-10495",
    payee: "Commercial Tow & Recovery Inc",
    memo: "Highway winching & bay delivery assistance",
    amount: 850.0,
    date: "Oct 08, 2026",
    status: "pending",
  },
];

export default function CheckPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F96176]">
              <CheckSquare size={14} />
              <span>Disbursements & Payments</span>
            </div>
            <h1 className="text-3xl font-black text-[#0B132B] mt-1">
              Check Management & Ledger
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Issue commercial vendor checks, track clearing status, and print draft vouchers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Write Check modal opened.")}
              className="px-4 py-2.5 rounded-xl bg-[#58BB87] hover:bg-[#48a674] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Write Vendor Check</span>
            </button>
          </div>
        </div>

        {/* Check Register Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#0B132B]">
              Recent Issued Checks
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              Bank Account: Operating Checking (**** 8841)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Check #</th>
                  <th className="py-3 px-4">Payee Name</th>
                  <th className="py-3 px-4">Memo / Description</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_CHECKS.map((chk) => (
                  <tr key={chk.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B132B]">
                      {chk.checkNo}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {chk.payee}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {chk.memo}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {chk.date}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#0B132B]">
                      {formatCurrency(chk.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          chk.status === "cleared"
                            ? "bg-[#EAF8F1] text-[#58BB87]"
                            : chk.status === "printed"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {chk.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Printing check voucher ${chk.checkNo}`)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#F96176] hover:text-white transition text-gray-600"
                        title="Print Check"
                      >
                        <Printer size={14} />
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
