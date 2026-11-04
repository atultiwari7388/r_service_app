"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { CarrierVehicleDoc } from "@/types/carrierFleet";
import {
  Truck,
  Car,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Gauge,
  Building,
  User,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import { LoadingIndicator } from "@/utils/LoadinIndicator";

export default function CarriersVehiclesPage() {
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [carrierVehicles, setCarrierVehicles] = useState<CarrierVehicleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<"lent" | "borrowed">("lent");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch current user data for effective ID (subowner support)
  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      try {
        const uDoc = await getDoc(doc(db, "Users", user.uid));
        if (uDoc.exists()) {
          const data = uDoc.data();
          if (data.role === "SubOwner" && data.createdBy) {
            setEffectiveUserId(data.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (e) {
        console.error("Error fetching user doc:", e);
        setEffectiveUserId(user.uid);
      }
    };
    fetchUser();
  }, [user]);

  // Real-time subscribe to carriersVehicles
  useEffect(() => {
    if (!effectiveUserId) return;
    setLoading(true);

    // Query 1: As Lender (fromId == effectiveUserId)
    const qLender = query(
      collection(db, "carriersVehicles"),
      where("fromId", "==", effectiveUserId)
    );

    // Query 2: As Borrower / Carrier (toId == effectiveUserId)
    const qBorrower = query(
      collection(db, "carriersVehicles"),
      where("toId", "==", effectiveUserId)
    );

    let listLender: CarrierVehicleDoc[] = [];
    let listBorrower: CarrierVehicleDoc[] = [];

    const updateCombined = () => {
      const map = new Map<string, CarrierVehicleDoc>();
      listLender.forEach((v) => map.set(v.id, v));
      listBorrower.forEach((v) => map.set(v.id, v));
      setCarrierVehicles(Array.from(map.values()));
      setLoading(false);
    };

    const unsubLender = onSnapshot(
      qLender,
      (snap) => {
        listLender = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CarrierVehicleDoc[];
        updateCombined();
      },
      (err) => {
        console.error("Error fetching lender carrier vehicles:", err);
        setLoading(false);
      }
    );

    const unsubBorrower = onSnapshot(
      qBorrower,
      (snap) => {
        listBorrower = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CarrierVehicleDoc[];
        updateCombined();
      },
      (err) => {
        console.error("Error fetching borrower carrier vehicles:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubLender();
      unsubBorrower();
    };
  }, [effectiveUserId]);

  // Filtered lists
  const filteredVehicles = useMemo(() => {
    return carrierVehicles.filter((v) => {
      // Tab filter
      const matchesTab =
        activeTab === "lent"
          ? v.fromId === effectiveUserId
          : v.toId === effectiveUserId;

      if (!matchesTab) return false;

      // Status filter
      if (statusFilter !== "all" && v.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && v.vehicleType !== typeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          v.vehicleNumber?.toLowerCase().includes(q) ||
          v.vin?.toLowerCase().includes(q) ||
          v.companyName?.toLowerCase().includes(q) ||
          v.toName?.toLowerCase().includes(q) ||
          v.fromName?.toLowerCase().includes(q) ||
          v.shareCode?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [carrierVehicles, activeTab, statusFilter, typeFilter, searchQuery, effectiveUserId]);

  const stats = useMemo(() => {
    const lentActive = carrierVehicles.filter(
      (v) => v.fromId === effectiveUserId && v.status === "active"
    ).length;
    const borrowedActive = carrierVehicles.filter(
      (v) => v.toId === effectiveUserId && v.status === "active"
    ).length;
    return {
      lentActive,
      borrowedActive,
      totalActive: lentActive + borrowedActive,
    };
  }, [carrierVehicles, effectiveUserId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Truck className="w-3.5 h-3.5" /> Fleet Sharing Units
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Carriers Vehicles
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage vehicles assigned out to partner carriers or allocated to your operating fleet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/fleet-sharing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              Fleet Sharing Agreements
            </Link>
            <Link
              href="/records?scope=carrier"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white shadow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              Carrier Records
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Active Units
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalActive}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lent to Carriers (Outbound)
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {stats.lentActive}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned to Me (Inbound)
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {stats.borrowedActive}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setActiveTab("lent")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "lent"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Assigned to Carriers (Outbound)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("borrowed")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "borrowed"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-indigo-600" />
                Assigned to Me (Inbound)
              </button>
            </div>

            {/* Quick Status Pill Filter */}
            <div className="flex items-center gap-2">
              {["active", "completed", "all"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Type dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vehicle #, VIN, company, carrier, or code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">All Vehicle Types</option>
                <option value="Truck">Trucks Only</option>
                <option value="Trailer">Trailers Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles Grid / List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingIndicator />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-4">
              No Carrier Vehicles Found
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              {activeTab === "lent"
                ? "You have not assigned any vehicles to other carriers yet, or none match the active filters."
                : "No partner owners have allocated equipment to your fleet yet, or none match the active filters."}
            </p>
            <div className="mt-6">
              <Link
                href="/fleet-sharing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-all"
              >
                Go to Fleet Sharing
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map((vehicle) => {
              const isActive = vehicle.status === "active";
              const isLent = vehicle.fromId === effectiveUserId;
              const counterpartyName = isLent
                ? vehicle.toCompanyName || vehicle.toName || "Carrier"
                : vehicle.fromCompanyName || vehicle.fromName || "Lender";
              const counterpartyRole = isLent ? "Assigned Carrier" : "Original Owner";

              return (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Row: Unit #, Type & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                              vehicle.vehicleType === "Truck"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {vehicle.vehicleType}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {vehicle.shareCode}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">
                          {vehicle.vehicleNumber}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {vehicle.companyName || "Fleet Unit"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                            Completed
                          </>
                        )}
                      </span>
                    </div>

                    {/* Counterparty Box */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          {counterpartyRole}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {counterpartyName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-gray-400" />
                          Current Miles
                        </span>
                        <span className="font-bold text-gray-900 font-mono">
                          {Number(vehicle.currentMiles || 0).toLocaleString()} mi
                        </span>
                      </div>
                    </div>

                    {/* Date / VIN Details */}
                    <div className="space-y-1 text-xs text-gray-500">
                      {vehicle.vin && (
                        <div className="flex justify-between">
                          <span>VIN:</span>
                          <span className="font-mono text-gray-700 font-medium truncate max-w-[180px]">
                            {vehicle.vin}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Started:</span>
                        <span className="text-gray-700 font-medium">
                          {vehicle.startDate || "N/A"}
                        </span>
                      </div>
                      {vehicle.expectedEndDate && (
                        <div className="flex justify-between">
                          <span>Expected Return:</span>
                          <span className="text-gray-700 font-medium">
                            {vehicle.expectedEndDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
                    <Link
                      href={`/records?scope=carrier&vehicle=${vehicle.vehicleId}`}
                      className="flex-1 text-center py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-600" />
                      View Records
                    </Link>
                    <Link
                      href="/fleet-sharing"
                      className="py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      Share Info
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
