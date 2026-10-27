"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContexts";
import {
  FiTruck,
  FiShare2,
  FiInbox,
  FiSend,
  FiPlus,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiEye,
  FiRotateCcw,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiFileText,
  FiCheck,
  FiX,
  FiChevronRight,
  FiLayers,
  FiTrendingUp,
} from "react-icons/fi";
import { format } from "date-fns";

// ==========================================
// TYPES & MOCK DATA STRUCTURES
// ==========================================

export interface SharedVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: "Truck" | "Trailer";
  companyName: string;
  vin?: string;
  currentMiles: number;
}

export interface FleetShareRecord {
  id: string;
  shareCode: string; // e.g. "SHR-2026-901"
  direction: "out" | "in"; // "out" = Lent by me, "in" = Borrowed by me
  status: "active" | "pending" | "returned" | "rejected";
  partnerCompany: string;
  partnerOwnerName: string;
  partnerPhone: string;
  partnerEmail: string;
  partnerLocation: string; // e.g., "Kochi, Kerala" or "Delhi NCR"
  vehiclesCount: number;
  vehicles: SharedVehicle[];
  assignedDriver?: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  startingOdometerNotes?: string;
  returnOdometerNotes?: string;
  leaseTerms?: string;
}

// Initial Mock Dataset for client demo
const INITIAL_RECORDS: FleetShareRecord[] = [
  {
    id: "shr-001",
    shareCode: "FST-2026-101",
    direction: "out",
    status: "active",
    partnerCompany: "South Express Logistics",
    partnerOwnerName: "Rajesh Nair",
    partnerPhone: "+91 98470 11223",
    partnerEmail: "rajesh@southexpress.com",
    partnerLocation: "Ernakulam, Kerala",
    vehiclesCount: 3,
    vehicles: [
      {
        id: "v1",
        vehicleNumber: "DL01-AB-1001",
        vehicleType: "Truck",
        companyName: "Freight India",
        vin: "1M8GDM9A_TRK01",
        currentMiles: 142500,
      },
      {
        id: "v2",
        vehicleNumber: "DL01-AB-1002",
        vehicleType: "Truck",
        companyName: "Freight India",
        vin: "1M8GDM9A_TRK02",
        currentMiles: 98400,
      },
      {
        id: "v3",
        vehicleNumber: "DL01-TR-2005",
        vehicleType: "Trailer",
        companyName: "Freight India",
        vin: "4V4NC9EH_TRL05",
        currentMiles: 45000,
      },
    ],
    assignedDriver: "Suresh Pillai",
    startDate: "2026-10-15",
    expectedEndDate: "2026-11-15",
    leaseTerms: "Temporary 1-Month South Route Expansion. Fuel & Driver managed by borrower.",
    startingOdometerNotes: "Inspected at Delhi Depot with fresh oil service.",
  },
  {
    id: "shr-002",
    shareCode: "FST-2026-102",
    direction: "out",
    status: "returned",
    partnerCompany: "Malabar Cargo Carriers",
    partnerOwnerName: "K. M. Mathew",
    partnerPhone: "+91 94471 55667",
    partnerEmail: "km.mathew@malabarcargo.in",
    partnerLocation: "Kozhikode, Kerala",
    vehiclesCount: 2,
    vehicles: [
      {
        id: "v4",
        vehicleNumber: "DL01-AB-1009",
        vehicleType: "Truck",
        companyName: "Freight India",
        currentMiles: 185200,
      },
      {
        id: "v5",
        vehicleNumber: "DL01-TR-2012",
        vehicleType: "Trailer",
        companyName: "Freight India",
        currentMiles: 62000,
      },
    ],
    startDate: "2026-09-01",
    expectedEndDate: "2026-09-30",
    actualEndDate: "2026-09-29",
    leaseTerms: "Festive Season peak support.",
    returnOdometerNotes: "Returned in good condition. All tires checked.",
  },
  {
    id: "shr-003",
    shareCode: "FST-2026-201",
    direction: "in",
    status: "active",
    partnerCompany: "Kochi Marine Freight",
    partnerOwnerName: "Thomas Kurian",
    partnerPhone: "+91 98950 33445",
    partnerEmail: "thomas@kochimarine.com",
    partnerLocation: "Kochi Port, Kerala",
    vehiclesCount: 2,
    vehicles: [
      {
        id: "vb1",
        vehicleNumber: "KL07-CC-8890",
        vehicleType: "Truck",
        companyName: "Kochi Marine Freight",
        vin: "3HSDZAPR_KL88",
        currentMiles: 78000,
      },
      {
        id: "vb2",
        vehicleNumber: "KL07-TR-4412",
        vehicleType: "Trailer",
        companyName: "Kochi Marine Freight",
        vin: "1UYVS253_KL44",
        currentMiles: 34100,
      },
    ],
    assignedDriver: "Vikram Sharma (My Driver)",
    startDate: "2026-10-20",
    expectedEndDate: "2026-11-20",
    leaseTerms: "Port Container Dispatch. 30-day agreement.",
    startingOdometerNotes: "Received at Cochin Port Terminal gate.",
  },
  {
    id: "shr-004",
    shareCode: "FST-2026-301",
    direction: "in",
    status: "pending",
    partnerCompany: "Wayanad Highland Freight",
    partnerOwnerName: "Anas Ahmed",
    partnerPhone: "+91 97450 77889",
    partnerEmail: "anas@highlandwayanad.com",
    partnerLocation: "Wayanad, Kerala",
    vehiclesCount: 2,
    vehicles: [
      {
        id: "vb3",
        vehicleNumber: "KL12-FF-3401",
        vehicleType: "Truck",
        companyName: "Highland Wayanad",
        currentMiles: 65400,
      },
      {
        id: "vb4",
        vehicleNumber: "KL12-FF-3402",
        vehicleType: "Truck",
        companyName: "Highland Wayanad",
        currentMiles: 71200,
      },
    ],
    startDate: "2026-10-28",
    expectedEndDate: "2026-12-15",
    leaseTerms: "Interstate spice & tea container transportation.",
  },
  {
    id: "shr-005",
    shareCode: "FST-2026-302",
    direction: "out",
    status: "pending",
    partnerCompany: "Coimbatore Roadways Corp",
    partnerOwnerName: "M. Saravanan",
    partnerPhone: "+91 94430 88990",
    partnerEmail: "saravanan@cberoadways.com",
    partnerLocation: "Coimbatore, Tamil Nadu",
    vehiclesCount: 1,
    vehicles: [
      {
        id: "v6",
        vehicleNumber: "DL01-AB-1025",
        vehicleType: "Truck",
        companyName: "Freight India",
        currentMiles: 112000,
      },
    ],
    startDate: "2026-10-29",
    expectedEndDate: "2026-11-29",
    leaseTerms: "Awaiting partner acceptance.",
  },
];

// Mock fleet of my own vehicles available for sharing
const MY_AVAILABLE_FLEET: SharedVehicle[] = [
  { id: "v10", vehicleNumber: "DL01-AB-1010", vehicleType: "Truck", companyName: "Freight India", currentMiles: 89000 },
  { id: "v11", vehicleNumber: "DL01-AB-1011", vehicleType: "Truck", companyName: "Freight India", currentMiles: 124500 },
  { id: "v12", vehicleNumber: "DL01-AB-1015", vehicleType: "Truck", companyName: "Freight India", currentMiles: 67300 },
  { id: "v13", vehicleNumber: "DL01-AB-1018", vehicleType: "Truck", companyName: "Freight India", currentMiles: 145000 },
  { id: "v14", vehicleNumber: "DL01-TR-2009", vehicleType: "Trailer", companyName: "Freight India", currentMiles: 52000 },
  { id: "v15", vehicleNumber: "DL01-TR-2015", vehicleType: "Trailer", companyName: "Freight India", currentMiles: 38000 },
  { id: "v16", vehicleNumber: "DL01-TR-2020", vehicleType: "Trailer", companyName: "Freight India", currentMiles: 41200 },
];

export default function FleetSharingPage() {
  const { user } = useAuth() || { user: null };

  // Data states
  const [records, setRecords] = useState<FleetShareRecord[]>(INITIAL_RECORDS);
  const [activeTab, setActiveTab] = useState<"lent" | "borrowed" | "pending">("lent");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<FleetShareRecord | null>(null);

  // New Lease Form State
  const [targetCarrierName, setTargetCarrierName] = useState("");
  const [targetCarrierContact, setTargetCarrierContact] = useState("");
  const [targetCarrierEmail, setTargetCarrierEmail] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [leaseDurationDays, setLeaseDurationDays] = useState("30");
  const [leaseTermsNotes, setLeaseTermsNotes] = useState("");
  const [odometerNote, setOdometerNote] = useState("");

  // Quick Notification Toast in UI
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // KPI Calculations
  const activeSharedOutCount = useMemo(() => {
    return records
      .filter((r) => r.direction === "out" && r.status === "active")
      .reduce((sum, r) => sum + r.vehiclesCount, 0);
  }, [records]);

  const activeSharedInCount = useMemo(() => {
    return records
      .filter((r) => r.direction === "in" && r.status === "active")
      .reduce((sum, r) => sum + r.vehiclesCount, 0);
  }, [records]);

  const pendingRequestsCount = useMemo(() => {
    return records.filter((r) => r.status === "pending").length;
  }, [records]);

  // Tab records filter
  const displayedRecords = useMemo(() => {
    return records.filter((rec) => {
      // Tab filter
      if (activeTab === "lent" && rec.direction !== "out") return false;
      if (activeTab === "borrowed" && rec.direction !== "in") return false;
      if (activeTab === "pending" && rec.status !== "pending") return false;

      // Status filter
      if (statusFilter !== "All" && rec.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = rec.shareCode.toLowerCase().includes(q);
        const matchCompany = rec.partnerCompany.toLowerCase().includes(q);
        const matchOwner = rec.partnerOwnerName.toLowerCase().includes(q);
        const matchLocation = rec.partnerLocation.toLowerCase().includes(q);
        const matchVehicle = rec.vehicles.some((v) =>
          v.vehicleNumber.toLowerCase().includes(q)
        );
        if (!matchCode && !matchCompany && !matchOwner && !matchLocation && !matchVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [records, activeTab, statusFilter, searchQuery]);

  // Handle Accept Incoming Request
  const handleAcceptRequest = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: "active" } : r))
    );
    showNotification("Fleet Request accepted! Leased vehicles are now added to your active fleet.");
  };

  // Handle Decline Incoming Request
  const handleDeclineRequest = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: "rejected" } : r))
    );
    showNotification("Fleet sharing request declined.");
  };

  // Handle Recall / Return Vehicle
  const handleReturnOrRecall = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: "returned",
              actualEndDate: format(new Date(), "yyyy-MM-dd"),
            }
          : r
      )
    );
    showNotification("Vehicles successfully returned and returned back to original fleet control.");
    if (selectedRecordForDetail?.id === recordId) {
      setSelectedRecordForDetail(null);
    }
  };

  // Handle Create Request Submit
  const handleCreateShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCarrierName.trim() || selectedVehicleIds.length === 0) {
      alert("Please fill carrier name and select at least one vehicle.");
      return;
    }

    const selectedVehicles = MY_AVAILABLE_FLEET.filter((v) =>
      selectedVehicleIds.includes(v.id)
    );

    const newRecord: FleetShareRecord = {
      id: `shr-${Date.now()}`,
      shareCode: `FST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      direction: "out",
      status: "pending",
      partnerCompany: targetCarrierName.trim(),
      partnerOwnerName: targetCarrierContact.trim() || "Fleet Manager",
      partnerPhone: targetCarrierContact.trim() || "+91 98000 00000",
      partnerEmail: targetCarrierEmail.trim() || "carrier@transport.com",
      partnerLocation: targetLocation.trim() || "Regional Hub",
      vehiclesCount: selectedVehicles.length,
      vehicles: selectedVehicles,
      startDate: format(new Date(), "yyyy-MM-dd"),
      expectedEndDate: format(
        new Date(Date.now() + Number(leaseDurationDays || 30) * 86400000),
        "yyyy-MM-dd"
      ),
      leaseTerms: leaseTermsNotes.trim() || "Standard inter-fleet exchange agreement.",
      startingOdometerNotes: odometerNote.trim() || "Initial inspection complete.",
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsCreateModalOpen(false);

    // Reset Form
    setTargetCarrierName("");
    setTargetCarrierContact("");
    setTargetCarrierEmail("");
    setTargetLocation("");
    setSelectedVehicleIds([]);
    setLeaseDurationDays("30");
    setLeaseTermsNotes("");
    setOdometerNote("");

    showNotification(`Fleet Sharing request (${newRecord.shareCode}) dispatched to ${newRecord.partnerCompany}!`);
  };

  const toggleSelectVehicle = (id: string) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500 text-white shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-xl shrink-0" />
            <span className="text-sm font-semibold">{bannerNotice}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-white hover:text-gray-200 text-lg font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F96176] uppercase tracking-wider mb-1">
            <FiShare2 className="text-sm" /> Fleet Exchange & Sharing Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Fleet Sharing
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Assign trucks & trailers to trusted partner carriers in other regions (e.g. South/Kerala) or borrow partner fleets with complete isolated record access and mileage control.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#F96176] hover:bg-[#e04f63] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer shrink-0"
        >
          <FiPlus className="text-base" /> Assign / Share Fleet
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Shared Out */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Lent To Partners
            </span>
            <span className="w-10 h-10 rounded-xl bg-rose-50 text-[#F96176] flex items-center justify-center text-lg">
              <FiSend />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-900">
              {activeSharedOutCount}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Vehicles</span>
          </div>
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <span>Currently under external carrier custody</span>
          </div>
        </div>

        {/* Card 2: Shared In */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Borrowed Fleets
            </span>
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              <FiTruck />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-900">
              {activeSharedInCount}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Vehicles</span>
          </div>
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <span>Operating under your active fleet</span>
          </div>
        </div>

        {/* Card 3: Pending Inquiries */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pending Exchanges
            </span>
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              <FiClock />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-900">
              {pendingRequestsCount}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Requests</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
            <span>Requires review or partner confirmation</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Row */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("lent");
                setStatusFilter("All");
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === "lent"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Lent Out ({records.filter((r) => r.direction === "out").length})
            </button>
            <button
              onClick={() => {
                setActiveTab("borrowed");
                setStatusFilter("All");
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === "borrowed"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Borrowed In ({records.filter((r) => r.direction === "in").length})
            </button>
            <button
              onClick={() => {
                setActiveTab("pending");
                setStatusFilter("All");
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition relative ${
                activeTab === "pending"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Pending Requests
              {pendingRequestsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search carrier, vehicle, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
              />
            </div>

            {/* Status Filter */}
            {activeTab !== "pending" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176] text-gray-700"
              >
                <option value="All">All Status</option>
                <option value="active">Active</option>
                <option value="returned">Returned</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / Grid View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {displayedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-2xl">
              <FiTruck />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Fleet Sharing Records Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {activeTab === "pending"
                ? "No pending requests right now."
                : "No lease agreements matching your search filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agreement Code</th>
                  <th className="py-3.5 px-4">
                    {activeTab === "lent" ? "Partner Carrier (Borrower)" : "Origin Carrier (Owner)"}
                  </th>
                  <th className="py-3.5 px-4">Vehicles Assigned</th>
                  <th className="py-3.5 px-4">Lease Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {displayedRecords.map((item) => {
                  const isActive = item.status === "active";
                  const isPending = item.status === "pending";
                  const isReturned = item.status === "returned";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Code & Direction */}
                      <td className="py-4 px-4 font-mono font-medium text-gray-900">
                        <div className="font-bold text-[#F96176]">{item.shareCode}</div>
                        <div className="text-[10px] text-gray-400 font-sans mt-0.5">
                          {item.direction === "out" ? "↑ Lent to Carrier" : "↓ Borrowed in Fleet"}
                        </div>
                      </td>

                      {/* Partner Carrier */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">{item.partnerCompany}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <FiUser className="text-[10px]" /> {item.partnerOwnerName} &bull; {item.partnerPhone}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <FiMapPin className="text-[10px]" /> {item.partnerLocation}
                        </div>
                      </td>

                      {/* Vehicles */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {item.vehiclesCount} {item.vehiclesCount === 1 ? "Unit" : "Units"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-[#F96176] font-semibold">
                            {item.vehicles.filter((v) => v.vehicleType === "Truck").length} Trucks,{" "}
                            {item.vehicles.filter((v) => v.vehicleType === "Trailer").length} Trailers
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-1">
                          {item.vehicles.slice(0, 3).map((v) => (
                            <span
                              key={v.id}
                              className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono"
                            >
                              {v.vehicleNumber}
                            </span>
                          ))}
                          {item.vehicles.length > 3 && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              +{item.vehicles.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-800">
                          {item.startDate} &rarr; {item.expectedEndDate || "Open"}
                        </div>
                        {item.actualEndDate && (
                          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            Returned on {item.actualEndDate}
                          </div>
                        )}
                        {item.assignedDriver && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Driver: <span className="font-semibold text-gray-600">{item.assignedDriver}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <FiClock className="text-xs" />
                            Pending Approval
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Returned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Pending Actions */}
                          {isPending && item.direction === "in" && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(item.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(item.id)}
                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {/* Active Return/Recall */}
                          {isActive && (
                            <button
                              onClick={() => handleReturnOrRecall(item.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            >
                              <FiRotateCcw className="text-xs" />
                              {item.direction === "out" ? "Recall Vehicles" : "Return to Owner"}
                            </button>
                          )}

                          {/* View Detail Modal Trigger */}
                          <button
                            onClick={() => setSelectedRecordForDetail(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="View Agreement & Vehicles"
                          >
                            <FiEye className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: CREATE / ASSIGN FLEET SHARING REQUEST */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-bold text-[#F96176] uppercase tracking-wider">
                  Outbound Lease Assignment
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  Assign Vehicles to Partner Carrier
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateShareSubmit} className="space-y-6">
              {/* Partner Details */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FiUser className="text-[#F96176]" /> Step 1: Target Carrier / Owner Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Carrier / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. South Express Logistics Pvt Ltd"
                      value={targetCarrierName}
                      onChange={(e) => setTargetCarrierName(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Carrier Owner Phone / Contact *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98470 12345"
                      value={targetCarrierContact}
                      onChange={(e) => setTargetCarrierContact(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Carrier Email
                    </label>
                    <input
                      type="email"
                      placeholder="carrier@transport.com"
                      value={targetCarrierEmail}
                      onChange={(e) => setTargetCarrierEmail(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Delivery / Operating Region
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cochin Port, Kerala"
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                    />
                  </div>
                </div>
              </div>

              {/* Select Vehicles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FiTruck className="text-[#F96176]" /> Step 2: Select Vehicles to Assign (
                    {selectedVehicleIds.length} Selected)
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    From your Delhi Fleet ({MY_AVAILABLE_FLEET.length} units available)
                  </span>
                </div>

                <div className="border border-gray-200 rounded-2xl p-3 max-h-48 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
                  {MY_AVAILABLE_FLEET.map((veh) => {
                    const isChecked = selectedVehicleIds.includes(veh.id);
                    return (
                      <label
                        key={veh.id}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition ${
                          isChecked ? "bg-rose-50/60" : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectVehicle(veh.id)}
                            className="rounded text-[#F96176] focus:ring-[#F96176] h-4 w-4"
                          />
                          <div>
                            <span className="text-xs font-bold text-gray-900">
                              {veh.vehicleNumber}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-2">
                              ({veh.vehicleType}) &bull; {veh.companyName}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-gray-500">
                          {veh.currentMiles.toLocaleString()} miles
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Terms & Odometer */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FiFileText className="text-[#F96176]" /> Step 3: Lease Terms & Inspection
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Lease Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={leaseDurationDays}
                      onChange={(e) => setLeaseDurationDays(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                      placeholder="e.g. 30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Handover / Odometer Inspection Note
                    </label>
                    <input
                      type="text"
                      value={odometerNote}
                      onChange={(e) => setOdometerNote(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                      placeholder="e.g. Full inspection done, clean tires."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Special Agreement / Maintenance Notes
                    </label>
                    <textarea
                      rows={2}
                      value={leaseTermsNotes}
                      onChange={(e) => setLeaseTermsNotes(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                      placeholder="Specify who bears maintenance, fuel responsibility, and driver assignment rules..."
                    />
                  </div>
                </div>
              </div>

              {/* Data Privacy Alert Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2.5">
                <FiAlertCircle className="text-base text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Privacy & Mileage Isolation Rule:</strong> Once accepted, these vehicles will be temporarily managed under the partner carrier&apos;s active fleet. Daily service records and runtime mileage entries will be managed by them until the lease is completed or recalled.
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#F96176] hover:bg-[#e04f63] text-white shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Send Lease Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: AGREEMENT DETAIL & INSPECTION MODAL */}
      {/* ============================================================ */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#F96176] uppercase tracking-wider">
                  Exchange Agreement Details
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {selectedRecordForDetail.shareCode}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status and Direction banner */}
              <div className="p-3.5 rounded-xl bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 font-medium">Agreement Type:</span>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {selectedRecordForDetail.direction === "out"
                      ? "Lent To Partner Carrier"
                      : "Borrowed In (Operating in My Fleet)"}
                  </div>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedRecordForDetail.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedRecordForDetail.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {selectedRecordForDetail.status}
                  </span>
                </div>
              </div>

              {/* Partner Card */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Partner Carrier Information
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {selectedRecordForDetail.partnerCompany}
                </div>
                <div className="text-gray-600 mt-1">
                  Contact: {selectedRecordForDetail.partnerOwnerName} &bull;{" "}
                  {selectedRecordForDetail.partnerPhone}
                </div>
                <div className="text-gray-500 mt-0.5">
                  Location: {selectedRecordForDetail.partnerLocation}
                </div>
              </div>

              {/* Assigned Vehicles List */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Assigned Equipment ({selectedRecordForDetail.vehicles.length} Units)
                </div>
                <div className="space-y-2">
                  {selectedRecordForDetail.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-900">
                          {v.vehicleNumber}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-2">
                          {v.vehicleType} &bull; {v.companyName}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-600">
                        {v.currentMiles.toLocaleString()} mi
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agreement Dates & Notes */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRecordForDetail.startDate}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Expected Return:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRecordForDetail.expectedEndDate || "Open-ended"}
                  </span>
                </div>
                {selectedRecordForDetail.startingOdometerNotes && (
                  <div className="py-1">
                    <span className="text-gray-500">Handover Notes:</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {selectedRecordForDetail.startingOdometerNotes}
                    </p>
                  </div>
                )}
                {selectedRecordForDetail.leaseTerms && (
                  <div className="py-1">
                    <span className="text-gray-500">Agreed Terms:</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {selectedRecordForDetail.leaseTerms}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons inside detail */}
              {selectedRecordForDetail.status === "active" && (
                <div className="pt-2">
                  <button
                    onClick={() => handleReturnOrRecall(selectedRecordForDetail.id)}
                    className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <FiRotateCcw className="text-sm" />
                    {selectedRecordForDetail.direction === "out"
                      ? "Recall Vehicles Back to Depot"
                      : "Release Vehicles Back to Origin Owner"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
