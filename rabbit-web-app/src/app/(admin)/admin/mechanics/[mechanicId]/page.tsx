"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Wrench,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Compass,
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

export default function AdminMechanicDetailsPage() {
  const params = useParams();
  const mechanicId = params?.mechanicId as string;

  const [mechanic, setMechanic] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMechanic = async () => {
    if (!mechanicId) return;
    setLoading(true);

    try {
      const docRef = doc(db, "Mechanics", mechanicId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        toast.error("Mechanic record not found");
        setMechanic(null);
        setLoading(false);
        return;
      }

      setMechanic({ id: snap.id, ...snap.data() });
    } catch (err: any) {
      console.error("Error fetching mechanic:", err);
      toast.error("Failed to load mechanic: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanic();
  }, [mechanicId]);

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
        <p className="text-xs text-gray-500 font-medium">Loading mechanic details...</p>
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Mechanic Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested mechanic ID <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{mechanicId}</code> does not exist in the Mechanics collection.
        </p>
        <Link
          href="/admin/mechanics"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mechanics</span>
        </Link>
      </div>
    );
  }

  const displayName = mechanic.workshopName || mechanic.userName || mechanic.name || "Workshop";
  const personName = mechanic.userName || mechanic.name || "";
  const phone = mechanic.phoneNumber || mechanic.phone || "";
  const isActive = mechanic.active !== false;
  const services: string[] = Array.isArray(mechanic.selected_services) ? mechanic.selected_services : [];
  const lat = mechanic.location?.latitude;
  const lng = mechanic.location?.longitude;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/mechanics"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-lg shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mechanics</span>
        </Link>

        <button
          onClick={fetchMechanic}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {mechanic.profilePicture || mechanic.mDp ? (
              <img
                src={mechanic.profilePicture || mechanic.mDp}
                alt={displayName}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {displayName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  {isActive ? "Active" : "Inactive"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Mechanic
                </span>
              </div>

              {personName && personName !== displayName && (
                <p className="text-xs text-gray-600 font-medium">Contact Person: {personName}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {mechanic.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{mechanic.email}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>

              {/* ID copy */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-gray-400 font-medium">ID:</span>
                <span className="font-mono text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[11px]">
                  {mechanic.id}
                </span>
                <button
                  onClick={() => handleCopy(mechanic.id, "ID")}
                  className="text-gray-400 hover:text-gray-700 transition"
                  title="Copy ID"
                >
                  {copiedId === "ID" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-w-[100px]">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Services</span>
              <span className="text-base font-bold text-blue-600">{services.length}</span>
            </div>
            {mechanic.wallet !== undefined && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-w-[100px]">
                <span className="block text-[10px] uppercase font-bold text-gray-400">Wallet</span>
                <span className="text-base font-bold text-emerald-600">${mechanic.wallet || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workshop & Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building2 className="w-4 h-4 text-amber-600" />
            Workshop & Business Information
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Workshop Name</span>
              <span className="font-semibold text-gray-900">{mechanic.workshopName || "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Mechanic Name</span>
              <span className="font-semibold text-gray-900">{mechanic.userName || mechanic.name || "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Email Address</span>
              <span className="font-semibold text-gray-900">{mechanic.email || "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Phone Number</span>
              <span className="font-semibold text-gray-900">{phone || "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Active Status</span>
              <span className={`font-semibold ${isActive ? "text-emerald-600" : "text-red-500"}`}>
                {isActive ? "Active in Network" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Coordinates */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            Location & Coordinates
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Address</span>
              <span className="font-semibold text-gray-900 text-right max-w-xs">{mechanic.address || "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">City / State</span>
              <span className="font-semibold text-gray-900">
                {[mechanic.city, mechanic.state].filter(Boolean).join(", ") || "-"}
              </span>
            </div>
            {lat !== undefined && lng !== undefined && (
              <>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">GPS Coordinates</span>
                  <span className="font-mono text-gray-900">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                </div>
                <div className="pt-1">
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </>
            )}
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Registered Date</span>
              <span className="font-semibold text-gray-900">{formatDate(mechanic.created_at || mechanic.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Offered Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#F96176]" />
            Selected Services Offered
          </h2>
          <span className="text-xs bg-rose-50 text-[#F96176] font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
            {services.length} Total Services
          </span>
        </div>

        {services.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            No specific services listed for this mechanic.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {services.map((service, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold border border-gray-200 transition"
              >
                <Sparkles className="w-3 h-3 text-[#F96176]" />
                <span>{service}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
