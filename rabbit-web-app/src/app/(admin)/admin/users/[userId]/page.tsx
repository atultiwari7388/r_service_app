"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProfileValues } from "@/types/types";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  Shield,
  Building,
  Truck,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Key,
  Bell,
  Clock,
  Layers,
  Car,
} from "lucide-react";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";

const formatDate = (val: any): string => {
  if (!val) return "N/A";
  try {
    if (typeof val?.toDate === "function") {
      return val.toDate().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (val?.seconds) {
      return new Date(val.seconds * 1000).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("en-US", {
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

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [user, setUser] = useState<ProfileValues | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "vehicles" | "companies" | "team">("overview");

  const fetchUserData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Fetch User Document
      const userRef = doc(db, "Users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast.error("User not found");
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = { uid: userSnap.id, ...userSnap.data() } as ProfileValues;
      setUser(userData);

      // 2. Fetch User's Vehicles subcollection
      try {
        const vehiclesSnap = await getDocs(collection(db, "Users", userId, "Vehicles"));
        const vList: any[] = [];
        vehiclesSnap.forEach((vDoc) => vList.push({ id: vDoc.id, ...vDoc.data() }));
        setVehicles(vList);
      } catch (err) {
        console.warn("Could not fetch user vehicles:", err);
      }

      // 3. Fetch User's Companies subcollection
      try {
        const compSnap = await getDocs(collection(db, "Users", userId, "myCompanies"));
        const cList: any[] = [];
        compSnap.forEach((cDoc) => cList.push({ id: cDoc.id, ...cDoc.data() }));
        setCompanies(cList);
      } catch (err) {
        console.warn("Could not fetch user companies:", err);
      }

      // 4. If Owner, fetch team members created by this user
      try {
        const teamQuery = query(collection(db, "Users"), where("createdBy", "==", userId));
        const teamSnap = await getDocs(teamQuery);
        const tList: any[] = [];
        teamSnap.forEach((tDoc) => tList.push({ id: tDoc.id, ...tDoc.data() }));
        setTeamMembers(tList);
      } catch (err) {
        console.warn("Could not fetch team members:", err);
      }
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      toast.error("Failed to load user details: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <HashLoader color="#F96176" size={45} />
        <p className="text-xs text-gray-500 font-medium">Loading user profile details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">User Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested user ID <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{userId}</code> does not exist in the Users collection.
        </p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users List</span>
        </Link>
      </div>
    );
  }

  const roleName = user.role || (user.isOwner ? "Owner" : "User");
  const isActive = user.active !== false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-lg shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users List</span>
        </Link>

        <button
          onClick={fetchUserData}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.userName || "User"}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm">
                {(user.userName || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {user.userName || "Unnamed User"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  {isActive ? "Active Account" : "Inactive"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-[#F96176] border border-rose-200">
                  {roleName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{user.email || "No email"}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                {(user.city || user.state) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{[user.city, user.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>

              {/* UID with copy button */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-gray-400 font-medium">UID:</span>
                <span className="font-mono text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[11px]">
                  {user.uid}
                </span>
                <button
                  onClick={() => handleCopy(user.uid, "UID")}
                  className="text-gray-400 hover:text-gray-700 transition"
                  title="Copy UID"
                >
                  {copiedId === "UID" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Wallet</span>
              <span className="text-base font-bold text-gray-900">${user.wallet || 0}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Vehicles</span>
              <span className="text-base font-bold text-[#F96176]">{vehicles.length}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Companies</span>
              <span className="text-base font-bold text-blue-600">{companies.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition -mb-[2px] cursor-pointer flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-[#F96176] text-[#F96176]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("vehicles")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition -mb-[2px] cursor-pointer flex items-center gap-2 ${
            activeTab === "vehicles"
              ? "border-[#F96176] text-[#F96176]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vehicles ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition -mb-[2px] cursor-pointer flex items-center gap-2 ${
            activeTab === "companies"
              ? "border-[#F96176] text-[#F96176]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Companies ({companies.length})</span>
        </button>

        {teamMembers.length > 0 && (
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition -mb-[2px] cursor-pointer flex items-center gap-2 ${
              activeTab === "team"
                ? "border-[#F96176] text-[#F96176]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Members ({teamMembers.length})</span>
          </button>
        )}
      </div>

      {/* Tab 1: Profile Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserIcon className="w-4 h-4 text-[#F96176]" />
              Account Information
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Username</span>
                <span className="font-semibold text-gray-900">{user.userName || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Email Address</span>
                <span className="font-semibold text-gray-900">{user.email || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Phone Number</span>
                <span className="font-semibold text-gray-900">{user.phoneNumber || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Primary Role</span>
                <span className="font-semibold text-gray-900">{user.role || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Wallet Balance</span>
                <span className="font-bold text-emerald-600">${user.wallet || 0}</span>
              </div>
              {user.perMileCharge && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Per Mile Charge</span>
                  <span className="font-semibold text-gray-900">${user.perMileCharge}</span>
                </div>
              )}
              {user.vehicleRange && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Vehicle Range</span>
                  <span className="font-semibold text-gray-900">{user.vehicleRange} mi</span>
                </div>
              )}
            </div>
          </div>

          {/* Address & Location */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              Address & Location
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Street Address</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs">{user.address || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">City</span>
                <span className="font-semibold text-gray-900">{user.city || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">State</span>
                <span className="font-semibold text-gray-900">{user.state || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Country</span>
                <span className="font-semibold text-gray-900">{user.country || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Last Known Address</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs">{user.lastAddress || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Location Set Status</span>
                <span className={`font-semibold ${user.isLocationSet ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isLocationSet ? "Configured" : "Not Set"}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions & Boolean Flags */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <Shield className="w-4 h-4 text-purple-600" />
              Permissions & Account Flags
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-600 font-medium">isOwner</span>
                <span className={`font-bold ${user.isOwner ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isOwner ? "YES" : "NO"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-600 font-medium">isTeamMember</span>
                <span className={`font-bold ${user.isTeamMember ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isTeamMember ? "YES" : "NO"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-600 font-medium">isAdd (Create)</span>
                <span className={`font-bold ${user.isAdd ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isAdd ? "YES" : "NO"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-600 font-medium">isEdit (Modify)</span>
                <span className={`font-bold ${user.isEdit ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isEdit ? "YES" : "NO"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-600 font-medium">isView (Read)</span>
                <span className={`font-bold ${user.isView ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isView ? "YES" : "NO"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-600 font-medium">Notification On</span>
                <span className={`font-bold ${user.isNotificationOn ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.isNotificationOn ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps & Metadata */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Metadata & System Identifiers
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Created Date</span>
                <span className="font-semibold text-gray-900">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Updated Date</span>
                <span className="font-semibold text-gray-900">{formatDate(user.updated_at)}</span>
              </div>
              {user.createdBy && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Created By</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-gray-800 text-[11px] truncate max-w-[140px]">{user.createdBy}</span>
                    <Link
                      href={`/admin/users/${user.createdBy}`}
                      className="text-[#F96176] hover:underline"
                      title="Inspect creator profile"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
              {user.fcmToken && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">FCM Token</span>
                  <button
                    onClick={() => handleCopy(user.fcmToken, "FCM Token")}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-mono bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    <span>Copy Token</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicles Subcollection */}
      {activeTab === "vehicles" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#F96176]" />
              Vehicles Subcollection (Users/{user.uid}/Vehicles)
            </h2>
            <span className="text-xs bg-rose-50 text-[#F96176] font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              {vehicles.length} Vehicles
            </span>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No vehicles found in this user&apos;s Vehicles subcollection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle #</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Company Make</th>
                    <th className="py-2.5 px-3">Engine</th>
                    <th className="py-2.5 px-3">VIN</th>
                    <th className="py-2.5 px-3">Current Miles/Hours</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{v.vehicleNumber || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                          {v.vehicleType || "Truck"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">{v.companyName || "-"}</td>
                      <td className="py-2.5 px-3 text-gray-700">{v.engineName || "-"}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">{v.vin || "-"}</td>
                      <td className="py-2.5 px-3 text-gray-700 font-medium">
                        {v.vehicleType === "Trailer" ? `${v.hoursReading || 0} hrs` : `${v.currentMiles || 0} mi`}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{formatDate(v.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Companies Subcollection */}
      {activeTab === "companies" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              My Companies (Users/{user.uid}/myCompanies)
            </h2>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {companies.length} Companies
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No companies found in this user&apos;s myCompanies subcollection.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{c.companyName || c.name || "Company"}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {c.dot && (
                    <p className="text-gray-600">
                      <strong className="text-gray-700">DOT:</strong> {c.dot}
                    </p>
                  )}
                  {c.mc && (
                    <p className="text-gray-600">
                      <strong className="text-gray-700">MC:</strong> {c.mc}
                    </p>
                  )}
                  {(c.city || c.state) && (
                    <p className="text-gray-500 text-[11px]">
                      {[c.city, c.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Team Members */}
      {activeTab === "team" && teamMembers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Team Members Created by this Owner
            </h2>
            <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
              {teamMembers.length} Members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{m.userName || "-"}</td>
                    <td className="py-2.5 px-3 text-gray-600">{m.email || "-"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {m.role || "TeamMember"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{m.phoneNumber || "-"}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.active !== false ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                        {m.active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/admin/users/${m.id}`}
                        className="text-[#F96176] hover:underline font-semibold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
