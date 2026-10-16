"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProfileValues } from "@/types/types";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Shield,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  ArrowUpDown,
  Filter,
  UserCheck,
  UserX,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const snap = await getDocs(collection(db, "Users"));
      const userList: ProfileValues[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        // Skip anonymous users
        if (data.isAnonymous === true) {
          return;
        }
        userList.push({
          uid: docSnap.id,
          ...data,
        } as ProfileValues);
      });
      setUsers(userList);
      if (isManualRefresh) toast.success("Users refreshed successfully");
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active !== false).length;
    const inactive = users.filter((u) => u.active === false).length;
    const owners = users.filter((u) => u.role?.toLowerCase() === "owner" || u.isOwner).length;
    const subowners = users.filter((u) => u.role?.toLowerCase() === "subowner").length;
    return { total, active, inactive, owners, subowners };
  }, [users]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Search text
        if (searchText.trim()) {
          const q = searchText.toLowerCase().trim();
          const name = (user.userName || "").toLowerCase();
          const email = (user.email || "").toLowerCase();
          const phone = (user.phoneNumber || "").toLowerCase();
          const uid = (user.uid || "").toLowerCase();
          const city = (user.city || "").toLowerCase();
          const state = (user.state || "").toLowerCase();
          const matches =
            name.includes(q) ||
            email.includes(q) ||
            phone.includes(q) ||
            uid.includes(q) ||
            city.includes(q) ||
            state.includes(q);
          if (!matches) return false;
        }

        // Role filter
        if (roleFilter !== "all") {
          const userRole = (user.role || "").toLowerCase();
          if (roleFilter === "owner" && userRole !== "owner" && !user.isOwner) return false;
          if (roleFilter === "subowner" && userRole !== "subowner") return false;
          if (roleFilter === "driver" && userRole !== "driver") return false;
          if (roleFilter === "guest" && !user.isGuest) return false;
          if (roleFilter === "other" && ["owner", "subowner", "driver"].includes(userRole)) return false;
        }

        // Status filter
        if (statusFilter === "active" && user.active === false) return false;
        if (statusFilter === "inactive" && user.active !== false) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.userName || "").localeCompare(b.userName || "");
        }
        const getTimestamp = (u: ProfileValues) => {
          if ((u as any).created_at?.toDate) return (u as any).created_at.toDate().getTime();
          if ((u as any).created_at?.seconds) return (u as any).created_at.seconds * 1000;
          if (u.created_at) return new Date(u.created_at as any).getTime() || 0;
          return 0;
        };
        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        if (sortBy === "newest") return timeB - timeA;
        return timeA - timeB;
      });
  }, [users, searchText, roleFilter, statusFilter, sortBy]);

  // Paginated Users
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-[#F96176]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Users Management
                <span className="text-xs px-2.5 py-0.5 font-semibold bg-rose-50 text-[#F96176] border border-rose-200 rounded-full">
                  {users.length} Total
                </span>
              </h1>
              <p className="text-xs text-gray-500">
                View, search and inspect all registered user profiles and subcollections
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Users</p>
            <p className="text-xl font-bold text-gray-900">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Active Users</p>
            <p className="text-xl font-bold text-gray-900">{metrics.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-[#F96176] flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Owners</p>
            <p className="text-xl font-bold text-gray-900">{metrics.owners}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">SubOwners</p>
            <p className="text-xl font-bold text-gray-900">{metrics.subowners}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, phone, city, UID..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:border-transparent transition"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="owner">👑 Owner</option>
              <option value="subowner">🛡️ SubOwner</option>
              <option value="driver">🚚 Driver</option>
              <option value="guest">👤 Guest</option>
              <option value="other">⚙️ Other</option>
            </select>
          </div>

          {/* Status Filter */}
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

        {/* Sort and Result Count */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 gap-2">
          <span>
            Showing <strong className="text-gray-800">{filteredUsers.length}</strong> matching user
            {filteredUsers.length === 1 ? "" : "s"}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#F96176] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <HashLoader color="#F96176" size={40} />
            <span className="text-xs font-medium text-gray-500">Loading Users from Firestore...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">No users found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No users match your search criteria. Try clearing filters or searching with a different keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role / Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedUsers.map((u) => {
                  const initial = (u.userName || u.email || "U").charAt(0).toUpperCase();
                  const roleName = u.role || (u.isOwner ? "Owner" : "User");
                  const isActive = u.active !== false;

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                      onClick={() => window.location.assign(`/admin/users/${u.uid}`)}
                    >
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.profilePicture ? (
                            <img
                              src={u.profilePicture}
                              alt={u.userName || "User"}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as any).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {u.userName || "Unnamed User"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-800" title={u.email}>
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{u.email || "-"}</span>
                          </div>
                          {u.phoneNumber && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{u.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              roleName.toLowerCase() === "owner" || u.isOwner
                                ? "bg-rose-50 text-[#F96176] border border-rose-200"
                                : roleName.toLowerCase() === "subowner"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : roleName.toLowerCase() === "driver"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {roleName}
                          </span>
                          {u.isTeamMember && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                              Team
                            </span>
                          )}
                          {u.isGuest && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 font-medium">
                              Guest
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-gray-600">
                        {u.city || u.state ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>
                              {[u.city, u.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        ) : u.address ? (
                          <span className="truncate max-w-[150px] block" title={u.address}>
                            {u.address}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(u.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/users/${u.uid}`}
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

        {/* Pagination Footer */}
        {filteredUsers.length > pageSize && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredUsers.length} total)
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
