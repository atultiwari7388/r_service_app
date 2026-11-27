"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Copy,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Truck,
  Wrench,
  Users,
  Infinity as InfinityIcon,
  Sparkles,
  Layers,
  ArrowUpDown,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Coupon,
  CouponTargetAudience,
} from "@/types/coupon";
import {
  getCoupons,
  deleteCoupon,
  toggleCouponStatus,
} from "@/lib/services/couponService";
import CouponModal from "./CouponModal";

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Copied code feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (err: any) {
      console.error("Error fetching coupons:", err);
      toast.error("Failed to load coupons from Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = !coupon.isActive;
    try {
      await toggleCouponStatus(coupon.id, newStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c))
      );
      toast.success(
        `Coupon "${coupon.code}" ${newStatus ? "activated" : "deactivated"}.`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    const confirm = window.confirm(
      `Are you sure you want to permanently delete coupon "${coupon.code}"?`
    );
    if (!confirm) return;

    try {
      await deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success(`Coupon "${coupon.code}" deleted.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon.");
    }
  };

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      // Search
      const search = searchQuery.trim().toLowerCase();
      const codeMatch = coupon.code.toLowerCase().includes(search);
      const descMatch = (coupon.description || "").toLowerCase().includes(search);
      if (search && !codeMatch && !descMatch) return false;

      // Audience
      if (audienceFilter !== "all" && coupon.targetAudience !== audienceFilter) {
        return false;
      }

      // Status
      if (statusFilter === "active" && !coupon.isActive) return false;
      if (statusFilter === "inactive" && coupon.isActive) return false;

      return true;
    });
  }, [coupons, searchQuery, audienceFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const noLimitCount = coupons.filter((c) => c.isNoLimit).length;
    return { total, active, totalUses, noLimitCount };
  }, [coupons]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F96176]">
            <Tag size={15} />
            <span>Promotions & Discounts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
            Coupons Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create and manage promotional discount coupons for Mechanics, Fleet Drivers, or Universal use.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs shadow-md shadow-[#F96176]/20 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Total Coupons</div>
            <div className="text-2xl font-black text-gray-900 mt-0.5">{metrics.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Active Coupons</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{metrics.active}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Total Redemptions</div>
            <div className="text-2xl font-black text-purple-600 mt-0.5">{metrics.totalUses}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">No Limit Coupons</div>
            <div className="text-2xl font-black text-teal-600 mt-0.5">{metrics.noLimitCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <InfinityIcon size={18} />
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupons by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Target Audience Filter */}
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="mechanic">Mechanics Only</option>
            <option value="owner_driver">Drivers & Owners</option>
            <option value="both">Universal (Both)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* 4. Coupons Table / List */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#F96176]" />
            <span className="text-xs font-semibold">Loading Coupons...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Tag size={22} />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Coupons Found</h4>
            <p className="text-xs text-gray-500 max-w-sm">
              {searchQuery || audienceFilter !== "all" || statusFilter !== "all"
                ? "No coupons match your filter criteria. Try resetting filters."
                : "You haven't created any promotional discount coupons yet. Click 'Create New Coupon' to start."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4 sm:px-6">Coupon Code & Details</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Limit Policy</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Uses</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition">
                    {/* Code & Description */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-gray-900 bg-pink-50 text-[#F96176] px-2.5 py-1 rounded-lg border border-pink-100">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code, coupon.id)}
                          className="p-1 text-gray-400 hover:text-gray-700 transition"
                          title="Copy Code"
                        >
                          {copiedId === coupon.id ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-[11px] text-gray-500 mt-1 max-w-xs truncate" title={coupon.description}>
                          {coupon.description}
                        </p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-sm text-emerald-600">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% OFF`
                          : `$${coupon.discountValue} OFF`}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {coupon.discountType === "percentage" ? "Percentage discount" : "Flat deduction"}
                      </span>
                    </td>

                    {/* Target Audience */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {coupon.targetAudience === "mechanic" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                          <Wrench size={11} />
                          <span>Mechanics Only</span>
                        </span>
                      ) : coupon.targetAudience === "owner_driver" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                          <Truck size={11} />
                          <span>Drivers & Owners</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                          <Users size={11} />
                          <span>Universal (Both)</span>
                        </span>
                      )}
                    </td>

                    {/* Limit Policy */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {coupon.isNoLimit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          <InfinityIcon size={12} />
                          <span>No Limit ($1 to $10k+)</span>
                        </span>
                      ) : (
                        <div className="text-[11px] text-gray-600 space-y-0.5">
                          {coupon.minAmount ? (
                            <div>Min: <span className="font-semibold text-gray-800">${coupon.minAmount}</span></div>
                          ) : (
                            <div className="text-gray-400">No min spend</div>
                          )}
                          {coupon.maxDiscountAmount ? (
                            <div>Cap: <span className="font-semibold text-gray-800">${coupon.maxDiscountAmount}</span></div>
                          ) : (
                            <div className="text-gray-400">No max cap</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Validity */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 text-[11px]">
                      {coupon.neverExpires ? (
                        <span className="font-semibold text-gray-700">Never Expires</span>
                      ) : coupon.expiryDate ? (
                        <div>
                          <div>Until: <span className="font-semibold text-gray-800">{coupon.expiryDate}</span></div>
                          {new Date(coupon.expiryDate).getTime() < Date.now() && (
                            <span className="text-[10px] text-red-500 font-bold">Expired</span>
                          )}
                        </div>
                      ) : (
                        <span>Open</span>
                      )}
                    </td>

                    {/* Uses */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 text-[11px]">
                      <span className="font-black text-gray-900">{coupon.usedCount || 0}</span>
                      {coupon.usageLimit ? (
                        <span className="text-gray-400"> / {coupon.usageLimit}</span>
                      ) : (
                        <span className="text-gray-400"> / ∞</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={coupon.isActive}
                          onChange={() => handleToggleStatus(coupon)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#58BB87]"></div>
                      </label>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Coupon"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Create / Edit Modal */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCoupon(null);
        }}
        onSuccess={fetchCoupons}
        editingCoupon={editingCoupon}
      />
    </div>
  );
}
