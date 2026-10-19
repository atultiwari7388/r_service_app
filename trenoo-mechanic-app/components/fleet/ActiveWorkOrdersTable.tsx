"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { FleetWorkOrder } from "@/types";

const MOCK_ORDERS: FleetWorkOrder[] = [
  {
    id: "wo-1",
    orderNumber: "WO-9481",
    unitNumber: "TRK-8812",
    vinOrPlate: "1FUJG5CG8LL...",
    vehicleType: "Semi-Tractor (Class 8)",
    fleetCompany: "Midwest Freight Line",
    primaryConcern: "Air brake chamber stroke limit & pressure warning",
    assignedBay: "Bay #2 (Heavy Diesel)",
    leadTechnician: "Marcus Vance (Master Tech)",
    status: "bay_in_progress",
    estimatedLaborHours: 3.5,
    totalCost: 780.0,
    dateCreated: "Today, 08:30 AM",
    dotRequired: true,
  },
  {
    id: "wo-2",
    orderNumber: "WO-9482",
    unitNumber: "TRL-4091",
    vinOrPlate: "1GR4820A3M...",
    vehicleType: "Refrigerated Reefer Trailer",
    fleetCompany: "California Cold Transport",
    primaryConcern: "Thermo King unit engine belt slip & reefer defrost coil",
    assignedBay: "Bay #4 (Reefer & Trailer)",
    leadTechnician: "Elena Rostova",
    status: "dot_inspection",
    estimatedLaborHours: 4.0,
    totalCost: 1120.0,
    dateCreated: "Today, 09:15 AM",
    dotRequired: true,
  },
  {
    id: "wo-3",
    orderNumber: "WO-9483",
    unitNumber: "TRL-1102",
    vinOrPlate: "3H3V532C2L...",
    vehicleType: "Dry Van Trailer",
    fleetCompany: "Western Logistics Corp",
    primaryConcern: "Landing gear gearbox replacement & roll-up door spring",
    assignedBay: "Bay #6 (Trailer Bay)",
    leadTechnician: "Dave Kim",
    status: "ready_for_pickup",
    estimatedLaborHours: 2.5,
    totalCost: 640.0,
    dateCreated: "Yesterday, 02:00 PM",
    dotRequired: false,
  },
  {
    id: "wo-4",
    orderNumber: "WO-9484",
    unitNumber: "TRK-5540",
    vinOrPlate: "2WKHD68X5N...",
    vehicleType: "Semi-Tractor (Class 8)",
    fleetCompany: "Apex Interstate Carriers",
    primaryConcern: "Cummins X15 DPF differential pressure sensor & regen",
    assignedBay: "Bay #1 (Diagnostic Bay)",
    leadTechnician: "Carlos Mendez",
    status: "bay_in_progress",
    estimatedLaborHours: 5.0,
    totalCost: 1450.0,
    dateCreated: "Today, 10:45 AM",
    dotRequired: true,
  },
  {
    id: "wo-5",
    orderNumber: "WO-9485",
    unitNumber: "TRL-7721",
    vinOrPlate: "1JJV532W9M...",
    vehicleType: "Intermodal Container Chassis",
    fleetCompany: "Pacific Drayage Fleet",
    primaryConcern: "Annual DOT 49 CFR Part 396 certification & 4 air valves",
    assignedBay: "Bay #5 (DOT Lane)",
    leadTechnician: "Marcus Vance",
    status: "scheduled",
    estimatedLaborHours: 2.0,
    totalCost: 490.0,
    dateCreated: "Today, 11:20 AM",
    dotRequired: true,
  },
];

export default function ActiveWorkOrdersTable() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch =
      order.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.fleetCompany.toLowerCase().includes(search.toLowerCase()) ||
      order.primaryConcern.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: FleetWorkOrder["status"]) => {
    switch (status) {
      case "bay_in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            In Bay Repair
          </span>
        );
      case "dot_inspection":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Clock size={12} />
            DOT Inspection
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#58BB87] text-xs font-bold border border-[#58BB87]/30">
            <CheckCircle2 size={12} />
            Ready for Pickup
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
            Scheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-8">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#F96176]">
            Live Dispatch Board
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">
            Commercial Truck & Trailer Work Orders
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search Unit #, Carrier, Issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "all" ? "bg-white text-gray-900 shadow-xs" : "hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("bay_in_progress")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "bay_in_progress"
                  ? "bg-white text-[#F96176] shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              In Bay
            </button>
            <button
              onClick={() => setFilter("ready_for_pickup")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "ready_for_pickup"
                  ? "bg-white text-[#58BB87] shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              Ready
            </button>
          </div>

          <Link
            href="/find-jobs"
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition flex items-center gap-1.5 ml-auto"
          >
            <span>Full Jobs Board</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4 rounded-l-xl">Unit & Order #</th>
              <th className="py-3 px-4">Fleet Carrier</th>
              <th className="py-3 px-4">Vehicle Type</th>
              <th className="py-3 px-4">Repair Concern / Service</th>
              <th className="py-3 px-4">Assigned Bay</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((wo) => (
              <tr
                key={wo.id}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                <td className="py-3.5 px-4">
                  <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Truck size={15} className="text-[#F96176]" />
                    <span>{wo.unitNumber}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {wo.orderNumber}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-gray-800">
                  {wo.fleetCompany}
                </td>
                <td className="py-3.5 px-4 text-gray-600 text-xs">
                  {wo.vehicleType}
                </td>
                <td className="py-3.5 px-4 max-w-xs">
                  <p className="font-medium text-gray-800 truncate" title={wo.primaryConcern}>
                    {wo.primaryConcern}
                  </p>
                  <span className="text-[11px] text-gray-500">
                    Est: {wo.estimatedLaborHours} hrs • ${(wo.totalCost).toFixed(2)}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-gray-900">{wo.assignedBay}</span>
                  <div className="text-[11px] text-gray-500 truncate">
                    {wo.leadTechnician}
                  </div>
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(wo.status)}</td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/invoice#${wo.orderNumber}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs hover:bg-[#F96176] hover:text-white transition group-hover:shadow-xs"
                  >
                    <span>Details</span>
                    <ArrowRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
