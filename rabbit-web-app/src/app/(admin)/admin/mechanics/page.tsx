"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Wrench,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";

interface MechanicData {
  id: string;
  userName?: string;
  name?: string;
  workshopName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  active?: boolean;
  selected_services?: string[];
  created_at?: any;
  createdAt?: any;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  profilePicture?: string;
  mDp?: string;
}

const formatDate = (val: any): string => {
  if (!val) return "N/A";
  try {
    if (typeof val?.toDate === "function") {
      return val.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (val?.seconds) {
      return new Date(val.seconds * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return "N/A";
  } catch {
    return "N/A";
  }
};

export default function AdminMechanicsPage() {
  const [mechanics, setMechanics] = useState<MechanicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("name");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchMechanics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const snap = await getDocs(collection(db, "Mechanics"));
      const list: MechanicData[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...d.data(),
        });
      });
      setMechanics(list);
      if (isManual) toast.success("Mechanics refreshed successfully");
    } catch (err: any) {
      console.error("Error fetching mechanics:", err);
      toast.error("Failed to load mechanics: " + (err?.message || ""));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    const total = mechanics.length;
    const active = mechanics.filter((m) => m.active !== false).length;
    const workshops = mechanics.filter((m) => Boolean(m.workshopName?.trim())).length;
    return { total, active, workshops };
  }, [mechanics]);

  // Filtered & Sorted
  const filtered = useMemo(() => {
    return mechanics
      .filter((m) => {
        if (searchText.trim()) {
          const q = searchText.toLowerCase().trim();
          const name = (m.userName || m.name || "").toLowerCase();
          const wName = (m.workshopName || "").toLowerCase();
          const email = (m.email || "").toLowerCase();
          const phone = (m.phoneNumber || m.phone || "").toLowerCase();
          const city = (m.city || "").toLowerCase();
          const id = m.id.toLowerCase();
          const matches =
            name.includes(q) ||
            wName.includes(q) ||
            email.includes(q) ||
            phone.includes(q) ||
            city.includes(q) ||
            id.includes(q);
          if (!matches) return false;
        }

        if (statusFilter === "active" && m.active === false) return false;
        if (statusFilter === "inactive" && m.active !== false) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          const nameA = a.workshopName || a.userName || a.name || "";
          const nameB = b.workshopName || b.userName || b.name || "";
          return nameA.localeCompare(nameB);
        }
        const getT = (item: MechanicData) => {
          const raw = item.created_at || item.createdAt;
          if (raw?.toDate) return raw.toDate().getTime();
          if (raw?.seconds) return raw.seconds * 1000;
          if (raw) return new Date(raw).getTime() || 0;
          return 0;
        };
        const tA = getT(a);
        const tB = getT(b);
        if (sortBy === "newest") return tB - tA;
        return tA - tB;
      });
  }, [mechanics, searchText, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5 text-[#F96176]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Mechanics Management
                <span className="text-xs px-2.5 py-0.5 font-semibold bg-rose-50 text-[#F96176] border border-rose-200 rounded-full">
                  {mechanics.length} Total
                </span>
              </h1>
              <p className="text-xs text-gray-500">
                View registered mechanics, workshops, and repair service providers
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchMechanics(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Mechanics</p>
            <p className="text-xl font-bold text-gray-900">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Active Mechanics</p>
            <p className="text-xl font-bold text-gray-900">{metrics.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">With Workshop Name</p>
            <p className="text-xl font-bold text-gray-900">{metrics.workshops}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by mechanic name, workshop, phone, email, city, ID..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:border-transparent transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 gap-2">
          <span>
            Showing <strong className="text-gray-800">{filtered.length}</strong> matching mechanic
            {filtered.length === 1 ? "" : "s"}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#F96176] cursor-pointer"
            >
              <option value="name">Name / Workshop (A-Z)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mechanics Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <HashLoader color="#F96176" size={40} />
            <span className="text-xs font-medium text-gray-500">Loading Mechanics from Firestore...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">No mechanics found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No mechanic records match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mechanic / Workshop</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Services Offered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginated.map((m) => {
                  const displayName = m.workshopName || m.userName || m.name || "Unknown Workshop";
                  const personName = m.userName || m.name || "";
                  const phone = m.phoneNumber || m.phone || "";
                  const isActive = m.active !== false;
                  const servicesCount = Array.isArray(m.selected_services) ? m.selected_services.length : 0;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                      onClick={() => window.location.assign(`/admin/mechanics/${m.id}`)}
                    >
                      {/* Name & Workshop */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {m.profilePicture || m.mDp ? (
                            <img
                              src={m.profilePicture || m.mDp}
                              alt={displayName}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as any).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {displayName}
                            </p>
                            {personName && personName !== displayName && (
                              <p className="text-[11px] text-gray-500 truncate">
                                Contact: {personName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {m.email && (
                            <div className="flex items-center gap-1.5 text-gray-800" title={m.email}>
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{m.email}</span>
                            </div>
                          )}
                          {phone && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{phone}</span>
                            </div>
                          )}
                          {!m.email && !phone && <span className="text-gray-400">-</span>}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-gray-600">
                        {m.city || m.state ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{[m.city, m.state].filter(Boolean).join(", ")}</span>
                          </div>
                        ) : m.address ? (
                          <span className="truncate max-w-[160px] block" title={m.address}>
                            {m.address}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Services */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {servicesCount} service{servicesCount === 1 ? "" : "s"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/mechanics/${m.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > pageSize && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filtered.length} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
