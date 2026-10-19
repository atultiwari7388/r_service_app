"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Plus, ShieldCheck, Download } from "lucide-react";
import { DotInspectionRecord } from "@/types";

const MOCK_INSPECTIONS: DotInspectionRecord[] = [
  {
    id: "dot-1",
    reportNumber: "DOT-2026-9011",
    unitNumber: "TRK-8812 (Peterbilt)",
    fleetCompany: "Midwest Freight Line",
    inspectionType: "Annual DOT",
    inspectorName: "Marcus Vance",
    certificationNumber: "FMCSA-CA-9941",
    result: "PASSED",
    defectsCount: 0,
    dateConducted: "Oct 12, 2026",
    expirationDate: "Oct 12, 2027",
  },
  {
    id: "dot-2",
    reportNumber: "DOT-2026-9012",
    unitNumber: "TRL-4091 (Reefer)",
    fleetCompany: "California Cold Transport",
    inspectionType: "Trailer Air-Brake",
    inspectorName: "Elena Rostova",
    certificationNumber: "FMCSA-CA-8820",
    result: "PASSED",
    defectsCount: 1,
    dateConducted: "Oct 11, 2026",
    expirationDate: "Oct 11, 2027",
  },
  {
    id: "dot-3",
    reportNumber: "DOT-2026-9013",
    unitNumber: "TRL-3310 (Chassis)",
    fleetCompany: "Pacific Drayage Fleet",
    inspectionType: "90-Day BIT",
    inspectorName: "Dave Kim",
    certificationNumber: "FMCSA-CA-7712",
    result: "OUT_OF_SERVICE",
    defectsCount: 3,
    dateConducted: "Oct 09, 2026",
    expirationDate: "Pending Re-Inspection",
  },
];

export default function InspectionsPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#58BB87]">
              <ShieldCheck size={14} />
              <span>Federal & State Compliance</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mt-1">
              DOT & Commercial Trailer Inspections
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              49 CFR Part 396 annual certifications, 90-day BIT audits, and air-brake compliance reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Start New DOT Inspection checklist.")}
              className="px-4 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>New Inspection Sheet</span>
            </button>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">
            Recent Inspection Certificates
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Certificate #</th>
                  <th className="py-3 px-4">Fleet & Unit</th>
                  <th className="py-3 px-4">Inspection Standard</th>
                  <th className="py-3 px-4">Certified Inspector</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">PDF Decal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_INSPECTIONS.map((insp) => (
                  <tr key={insp.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F96176]">
                      {insp.reportNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{insp.unitNumber}</div>
                      <div className="text-[11px] text-gray-500">{insp.fleetCompany}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {insp.inspectionType}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div>{insp.inspectorName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {insp.certificationNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          insp.result === "PASSED"
                            ? "bg-[#EAF8F1] text-[#58BB87]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {insp.result}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {insp.expirationDate}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading DOT Certificate: ${insp.reportNumber}`)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#58BB87] hover:text-white transition text-gray-600"
                        title="Download Certificate"
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
