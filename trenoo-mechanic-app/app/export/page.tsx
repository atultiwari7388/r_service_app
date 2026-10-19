"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Download, FileSpreadsheet } from "lucide-react";

export default function ExportPage() {
  const exportCards = [
    {
      title: "Work Orders (CSV / Excel)",
      desc: "Complete dataset of all truck & trailer work orders, labor hours, technician notes, and parts line-items.",
      format: ".CSV / .XLSX",
      actionText: "Download Work Orders",
    },
    {
      title: "Accounting & QuickBooks Export",
      desc: "General ledger format for QuickBooks Online, Enterprise, and SAP accounting systems.",
      format: ".IIF / .QBO",
      actionText: "Export Accounting Ledger",
    },
    {
      title: "DOT Audit & Compliance Package",
      desc: "FMCSA-ready zip archive containing all signed annual inspection certificates and brake measurements.",
      format: ".ZIP (PDFs)",
      actionText: "Generate Audit Archive",
    },
    {
      title: "Parts & Inventory Audit",
      desc: "Current stock level, wholesale costs, reorder triggers, and supplier reference numbers.",
      format: ".CSV",
      actionText: "Export Parts Stock",
    },
  ];

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F96176]">
            <Download size={14} />
            <span>Data Management</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-1">
            Data Export & Integrations
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Download fleet records, synchronize with accounting ERP, or generate FMCSA audit packages.
          </p>
        </div>

        {/* Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exportCards.map((card) => (
            <div
              key={card.title}
              className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#F96176]">
                    <FileSpreadsheet size={20} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold font-mono">
                    {card.format}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-1">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <button
                onClick={() => alert(`Starting export: ${card.title}`)}
                className="w-full py-3 rounded-xl bg-gray-900 hover:bg-[#F96176] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={16} />
                <span>{card.actionText}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
