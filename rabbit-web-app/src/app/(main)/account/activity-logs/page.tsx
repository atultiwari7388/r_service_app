"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { ProfileValues } from "@/types/types";
import { AuditLogEntry, AuditCategory } from "@/lib/auditLogger";
import { format, formatDistanceToNow } from "date-fns";
import {
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUsers,
  FaHistory,
  FaFileAlt,
  FaDollarSign,
  FaCheckSquare,
  FaTruck,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaInfoCircle,
  FaWrench,
  FaChartBar,
} from "react-icons/fa";

const PAGE_SIZE = 20;

const CATEGORIES: { label: string; value: AuditCategory | "All" }[] = [
  { label: "All Categories", value: "All" },
  { label: "Records", value: "Records" },
  { label: "Expenses", value: "Expenses" },
  { label: "Checks", value: "Checks" },
  { label: "Team", value: "Team" },
  { label: "Vehicles", value: "Vehicles" },
  { label: "Companies", value: "Companies" },
  { label: "Dispatch", value: "Dispatch" },
  { label: "Reports", value: "Reports" },
  { label: "Mechanic", value: "Mechanic" },
  { label: "Navigation", value: "Navigation" },
  { label: "General", value: "General" },
];

export default function ActivityLogsPage() {
  const auth = useAuth();
  const user = auth?.user;

  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [effectiveOwnerId, setEffectiveOwnerId] = useState<string>("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("All");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Team members for filter dropdown
  const [teamMembers, setTeamMembers] = useState<
    { id: string; name: string; role: string }[]
  >([]);

  // Logs & Pagination State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [pageSnapshots, setPageSnapshots] = useState<DocumentSnapshot[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Selected Log for Modal
  const [inspectLog, setInspectLog] = useState<AuditLogEntry | null>(null);

  // 1. Fetch user data & determine owner
  useEffect(() => {
    if (!user?.uid) {
      setIsAuthLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as ProfileValues;
          setUserData(data);

          if (data.role === "SubOwner" && data.createdBy) {
            setEffectiveOwnerId(data.createdBy);
          } else {
            setEffectiveOwnerId(user.uid);
          }
        }
      } catch (err) {
        console.error("Error loading user data for activity logs:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // Role Guard: Only Owner & SubOwner can view audit logs
  const isAuthorized =
    userData?.role === "Owner" || userData?.role === "SubOwner";

  // 2. Fetch team members list for filtering
  useEffect(() => {
    if (!effectiveOwnerId || !isAuthorized) return;

    const fetchTeamMembers = async () => {
      try {
        const q = query(
          collection(db, "Users"),
          where("createdBy", "==", effectiveOwnerId),
          where("isTeamMember", "==", true)
        );
        const snap = await getDocs(q);
        const members: { id: string; name: string; role: string }[] = [];
        snap.forEach((d) => {
          const mData = d.data();
          members.push({
            id: d.id,
            name: mData.userName || mData.name || mData.email || "Team Member",
            role: mData.role || "Member",
          });
        });
        setTeamMembers(members);
      } catch (err) {
        console.error("Error fetching team members for logs filter:", err);
      }
    };

    fetchTeamMembers();
  }, [effectiveOwnerId, isAuthorized]);

  // 3. Fetch logs from Users/{ownerId}/audit_logs with pagination
  const fetchLogs = useCallback(
    async (pageIndex: number, cursorDoc?: DocumentSnapshot) => {
      if (!effectiveOwnerId || !isAuthorized) return;

      setIsLoadingLogs(true);
      try {
        const logsCol = collection(db, "Users", effectiveOwnerId, "audit_logs");

        // Base constraints
        let constraints: any[] = [orderBy("timestamp", "desc")];

        if (selectedCategory !== "All") {
          constraints.unshift(where("category", "==", selectedCategory));
        }

        if (selectedMemberId !== "All") {
          constraints.unshift(where("performedBy.uid", "==", selectedMemberId));
        }

        // Apply cursor pagination
        if (pageIndex > 1 && cursorDoc) {
          constraints.push(startAfter(cursorDoc));
        }

        // Fetch PAGE_SIZE + 1 to detect if there is a next page
        constraints.push(limit(PAGE_SIZE + 1));

        const q = query(logsCol, ...constraints);
        const snap = await getDocs(q);

        const loaded: AuditLogEntry[] = [];
        snap.docs.slice(0, PAGE_SIZE).forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as any) });
        });

        setLogs(loaded);
        setHasNextPage(snap.docs.length > PAGE_SIZE);

        if (snap.docs.length > 0) {
          const lastDocOnPage =
            snap.docs[Math.min(snap.docs.length - 1, PAGE_SIZE - 1)];
          setPageSnapshots((prev) => {
            const next = [...prev];
            next[pageIndex - 1] = lastDocOnPage;
            return next;
          });
        }
      } catch (err) {
        console.error("Error querying audit_logs:", err);
      } finally {
        setIsLoadingLogs(false);
      }
    },
    [effectiveOwnerId, isAuthorized, selectedCategory, selectedMemberId]
  );

  // Trigger initial fetch and reset pagination on filter change
  useEffect(() => {
    if (!effectiveOwnerId || !isAuthorized) return;
    setCurrentPage(1);
    setPageSnapshots([]);
    fetchLogs(1);
  }, [
    effectiveOwnerId,
    isAuthorized,
    selectedCategory,
    selectedMemberId,
    fetchLogs,
  ]);

  // Next Page
  const handleNextPage = () => {
    if (!hasNextPage || isLoadingLogs) return;
    const currentCursor = pageSnapshots[currentPage - 1];
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchLogs(nextPage, currentCursor);
  };

  // Previous Page
  const handlePrevPage = () => {
    if (currentPage <= 1 || isLoadingLogs) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    // Cursor for target page is pageSnapshots[prevPage - 2]
    const targetCursor = prevPage > 1 ? pageSnapshots[prevPage - 2] : undefined;
    fetchLogs(prevPage, targetCursor);
  };

  // Filter logs locally by search query, dateRange, and exclude Owner logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 0. Exclude Owner data from activity logs UI (only show team members' activities)
      const role = (log.performedBy?.role || "").toLowerCase();
      if (role === "owner" || log.performedBy?.uid === effectiveOwnerId) {
        return false;
      }

      // 1. Date Range
      if (dateRange !== "all" && log.timestamp) {
        let logDate: Date;
        if (log.timestamp instanceof Timestamp) {
          logDate = log.timestamp.toDate();
        } else if (log.timestamp.seconds) {
          logDate = new Date(log.timestamp.seconds * 1000);
        } else {
          logDate = new Date(log.timestamp);
        }

        const now = new Date();
        if (dateRange === "today") {
          const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          if (logDate < startOfToday) return false;
        } else if (dateRange === "week") {
          const sevenDaysAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          if (logDate < sevenDaysAgo) return false;
        } else if (dateRange === "month") {
          const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
          );
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = log.performedBy?.name?.toLowerCase().includes(q);
        const matchesEmail = log.performedBy?.email?.toLowerCase().includes(q);
        const matchesRole = log.performedBy?.role?.toLowerCase().includes(q);
        const matchesTitle = log.title?.toLowerCase().includes(q);
        const matchesTarget = log.targetName?.toLowerCase().includes(q);
        const matchesDesc = log.description?.toLowerCase().includes(q);
        const matchesCategory = log.category?.toLowerCase().includes(q);

        return (
          matchesName ||
          matchesEmail ||
          matchesRole ||
          matchesTitle ||
          matchesTarget ||
          matchesDesc ||
          matchesCategory
        );
      }

      return true;
    });
  }, [logs, searchQuery, dateRange]);

  // Category Icon & Color Helper
  const getCategoryMeta = (cat: AuditCategory | string) => {
    switch (cat) {
      case "Expenses":
        return {
          icon: <FaDollarSign className="text-amber-500" />,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "Records":
        return {
          icon: <FaFileAlt className="text-blue-500" />,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "Checks":
        return {
          icon: <FaCheckSquare className="text-emerald-500" />,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "Team":
        return {
          icon: <FaUsers className="text-purple-500" />,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "Vehicles":
        return {
          icon: <FaTruck className="text-indigo-500" />,
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "Dispatch":
        return {
          icon: <FaTruck className="text-rose-500" />,
          bg: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "Reports":
        return {
          icon: <FaChartBar className="text-teal-500" />,
          bg: "bg-teal-50 text-teal-700 border-teal-200",
        };
      case "Mechanic":
        return {
          icon: <FaWrench className="text-orange-500" />,
          bg: "bg-orange-50 text-orange-700 border-orange-200",
        };
      default:
        return {
          icon: <FaHistory className="text-gray-500" />,
          bg: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  };

  // Format Timestamp Helper
  const formatLogTime = (ts: any) => {
    if (!ts) return { full: "Just now", relative: "" };
    let d: Date;
    if (ts instanceof Timestamp) {
      d = ts.toDate();
    } else if (ts.seconds) {
      d = new Date(ts.seconds * 1000);
    } else {
      d = new Date(ts);
    }
    if (isNaN(d.getTime())) return { full: "Just now", relative: "" };

    return {
      full: format(d, "dd MMM yyyy, hh:mm a"),
      relative: formatDistanceToNow(d, { addSuffix: true }),
    };
  };

  // If Auth loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F96176]"></div>
      </div>
    );
  }

  // Access Denied Screen (Strictly for non-owners)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <div className="w-14 h-14 bg-rose-50 text-[#F96176] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            You do not have permission to view Team Activity Logs. This page is
            exclusively accessible to the Account Owner.
          </p>
          <Link
            href="/records"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F96176] hover:bg-[#e04f63] text-white text-sm font-semibold rounded-xl transition shadow-xs"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/account/manage-team"
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-150 flex items-center justify-center shadow-xs"
                title="Back to Manage Team"
              >
                <FaArrowLeft className="text-sm" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Track Team Activity
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    Audit Trail
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monitor real-time actions performed by your team members
                  across all modules
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                  Page
                </span>
                <span className="text-sm font-extrabold text-gray-900">
                  {currentPage}
                </span>
              </div>
              <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                  Logs On Page
                </span>
                <span className="text-sm font-extrabold text-[#F96176]">
                  {filteredLogs.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Filters Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search member, action, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F96176]/20 focus:border-[#F96176] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F96176]/20 focus:border-[#F96176] transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Member Dropdown */}
            <div>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F96176]/20 focus:border-[#F96176] transition-all cursor-pointer"
              >
                <option value="All">
                  All Team Members ({teamMembers.length})
                </option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {(
                [
                  { label: "All", val: "all" },
                  { label: "Today", val: "today" },
                  { label: "7 Days", val: "week" },
                  { label: "30 Days", val: "month" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => setDateRange(tab.val)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    dateRange === tab.val
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {isLoadingLogs ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F96176]"></div>
              <p className="text-xs text-gray-500 mt-3 font-medium">
                Loading activity logs...
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <FaHistory />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                No activity logs found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {searchQuery ||
                selectedCategory !== "All" ||
                selectedMemberId !== "All" ||
                dateRange !== "all"
                  ? "Try resetting your search filters to view recorded actions."
                  : "Actions performed by your team members (e.g. adding records, writing checks, managing expenses) will appear here in real-time."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Team Member</th>
                    <th className="py-3.5 px-4 sm:px-6">Category & Action</th>
                    <th className="py-3.5 px-4 sm:px-6">Action Details</th>
                    <th className="py-3.5 px-4 sm:px-6">Time</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredLogs.map((log) => {
                    const timeInfo = formatLogTime(log.timestamp);
                    const catMeta = getCategoryMeta(log.category);

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setInspectLog(log)}
                        className="hover:bg-gray-50/75 transition-colors cursor-pointer group"
                      >
                        {/* Member */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center font-bold text-gray-700 text-xs overflow-hidden shrink-0 border border-gray-200 shadow-2xs">
                              {log.performedBy?.profilePicture ? (
                                <Image
                                  src={log.performedBy.profilePicture}
                                  alt={log.performedBy.name}
                                  width={36}
                                  height={36}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (
                                  log.performedBy?.name?.[0] || "U"
                                ).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-xs group-hover:text-[#F96176] transition-colors">
                                {log.performedBy?.name || "Unknown"}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-500">
                                  {log.performedBy?.email || "No email"}
                                </span>
                                <span className="inline-block px-1.5 py-0.2 bg-gray-100 text-gray-700 text-[9px] font-semibold rounded">
                                  {log.performedBy?.role || "Member"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs">
                            {catMeta.icon}
                            <span className="text-gray-900">
                              {log.category}
                            </span>
                            <span className="text-gray-400 font-normal">|</span>
                            <span className="text-gray-600 font-mono text-[10px]">
                              {log.action}
                            </span>
                          </div>
                        </td>

                        {/* Action Details */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="max-w-md">
                            <div className="font-bold text-xs text-gray-900 truncate">
                              {log.title}
                            </div>
                            {log.targetName && (
                              <div className="text-[11px] text-gray-600 truncate mt-0.5">
                                Target:{" "}
                                <span className="font-medium text-gray-800">
                                  {log.targetName}
                                </span>
                              </div>
                            )}
                            {log.description && (
                              <div className="text-[11px] text-gray-500 truncate mt-0.5">
                                {log.description}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {timeInfo.full}
                          </div>
                          {timeInfo.relative && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {timeInfo.relative}
                            </div>
                          )}
                        </td>

                        {/* Context & View */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {log.path && (
                              <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-600 rounded">
                                {log.path}
                              </span>
                            )}
                            <button
                              type="button"
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                              title="Inspect Details"
                            >
                              <FaInfoCircle className="text-xs" />
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

          {/* Pagination Footer */}
          <div className="p-4 bg-gray-50/75 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Showing page{" "}
              <span className="font-bold text-gray-900">{currentPage}</span>
              {" · "}
              <span className="font-medium text-gray-700">
                {filteredLogs.length} entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isLoadingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
              >
                <FaChevronLeft className="text-[10px]" /> Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!hasNextPage || isLoadingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
              >
                Next <FaChevronRight className="text-[10px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FaInfoCircle className="text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Activity Details
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ID: {inspectLog.id || "N/A"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">
                    Performed By
                  </span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {inspectLog.performedBy?.name}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {inspectLog.performedBy?.role} (
                    {inspectLog.performedBy?.email})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">
                    Category & Action
                  </span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {inspectLog.category}
                  </span>
                  <span className="font-mono text-[10px] text-blue-600">
                    {inspectLog.action}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">
                  Summary
                </span>
                <p className="font-semibold text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {inspectLog.title}
                </p>
              </div>

              {inspectLog.targetName && (
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">
                    Target Name / Reference
                  </span>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded-lg font-mono text-[11px]">
                    {inspectLog.targetName}
                  </p>
                </div>
              )}

              {inspectLog.description && (
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">
                    Description
                  </span>
                  <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                    {inspectLog.description}
                  </p>
                </div>
              )}

              {inspectLog.metadata &&
                Object.keys(inspectLog.metadata).length > 0 && (
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">
                      Metadata Payload
                    </span>
                    <pre className="bg-[#0B132B] text-gray-200 p-3 rounded-xl overflow-x-auto text-[11px] font-mono">
                      {JSON.stringify(inspectLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                <span>Path: {inspectLog.path || "N/A"}</span>
                <span>{formatLogTime(inspectLog.timestamp).full}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
