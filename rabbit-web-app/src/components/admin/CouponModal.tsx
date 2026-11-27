"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  Users,
  Infinity as InfinityIcon,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Coupon,
  CouponDiscountType,
  CouponTargetAudience,
} from "@/types/coupon";
import { createCoupon, updateCoupon } from "@/lib/services/couponService";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCoupon?: Coupon | null;
}

export default function CouponModal({
  isOpen,
  onClose,
  onSuccess,
  editingCoupon,
}: CouponModalProps) {
  const isEditing = Boolean(editingCoupon);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<string>("5");
  const [targetAudience, setTargetAudience] = useState<CouponTargetAudience>("both");

  // No Limit Flag
  const [isNoLimit, setIsNoLimit] = useState<boolean>(true);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");

  // Dates & Usage
  const [neverExpires, setNeverExpires] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [perUserLimit, setPerUserLimit] = useState<string>("1");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate on edit
  useEffect(() => {
    if (editingCoupon) {
      setCode(editingCoupon.code || "");
      setDescription(editingCoupon.description || "");
      setDiscountType(editingCoupon.discountType || "percentage");
      setDiscountValue(String(editingCoupon.discountValue ?? "5"));
      setTargetAudience(editingCoupon.targetAudience || "both");
      setIsNoLimit(Boolean(editingCoupon.isNoLimit));
      setMinAmount(
        editingCoupon.minAmount !== null && editingCoupon.minAmount !== undefined
          ? String(editingCoupon.minAmount)
          : ""
      );
      setMaxDiscountAmount(
        editingCoupon.maxDiscountAmount !== null &&
          editingCoupon.maxDiscountAmount !== undefined
          ? String(editingCoupon.maxDiscountAmount)
          : ""
      );
      setNeverExpires(Boolean(editingCoupon.neverExpires));
      setStartDate(editingCoupon.startDate || "");
      setExpiryDate(editingCoupon.expiryDate || "");
      setUsageLimit(
        editingCoupon.usageLimit ? String(editingCoupon.usageLimit) : ""
      );
      setPerUserLimit(
        editingCoupon.perUserLimit ? String(editingCoupon.perUserLimit) : "1"
      );
      setIsActive(editingCoupon.isActive !== false);
    } else {
      // Default reset
      setCode("");
      setDescription("");
      setDiscountType("percentage");
      setDiscountValue("5");
      setTargetAudience("both");
      setIsNoLimit(true);
      setMinAmount("");
      setMaxDiscountAmount("");
      setNeverExpires(true);
      setStartDate(new Date().toISOString().split("T")[0]);
      setExpiryDate("");
      setUsageLimit("");
      setPerUserLimit("1");
      setIsActive(true);
    }
  }, [editingCoupon, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a valid coupon code.");
      return;
    }

    const numVal = parseFloat(discountValue);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error("Please enter a positive discount value.");
      return;
    }

    if (discountType === "percentage" && numVal > 100) {
      toast.error("Percentage discount cannot exceed 100%.");
      return;
    }

    let parsedMin: number | null = null;
    let parsedMaxCap: number | null = null;

    if (!isNoLimit) {
      if (minAmount.trim()) {
        const m = parseFloat(minAmount);
        if (!isNaN(m) && m > 0) parsedMin = m;
      }
      if (maxDiscountAmount.trim()) {
        const mx = parseFloat(maxDiscountAmount);
        if (!isNaN(mx) && mx > 0) parsedMaxCap = mx;
      }
    }

    let parsedUsageLimit: number | null = null;
    if (usageLimit.trim()) {
      const u = parseInt(usageLimit, 10);
      if (!isNaN(u) && u > 0) parsedUsageLimit = u;
    }

    let parsedPerUser = 1;
    if (perUserLimit.trim()) {
      const pu = parseInt(perUserLimit, 10);
      if (!isNaN(pu) && pu > 0) parsedPerUser = pu;
    }

    if (!neverExpires && !expiryDate) {
      toast.error("Please set an expiry date or enable 'Never Expires'.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingCoupon) {
        await updateCoupon(editingCoupon.id, {
          code: cleanCode,
          description: description.trim(),
          discountType,
          discountValue: numVal,
          targetAudience,
          isNoLimit,
          minAmount: isNoLimit ? null : parsedMin,
          maxDiscountAmount: isNoLimit ? null : parsedMaxCap,
          neverExpires,
          startDate: startDate || null,
          expiryDate: neverExpires ? null : expiryDate || null,
          usageLimit: parsedUsageLimit,
          perUserLimit: parsedPerUser,
          isActive,
        });
        toast.success(`Coupon "${cleanCode}" updated successfully!`);
      } else {
        await createCoupon({
          code: cleanCode,
          description: description.trim(),
          discountType,
          discountValue: numVal,
          targetAudience,
          isNoLimit,
          minAmount: isNoLimit ? null : parsedMin,
          maxDiscountAmount: isNoLimit ? null : parsedMaxCap,
          neverExpires,
          startDate: startDate || null,
          expiryDate: neverExpires ? null : expiryDate || null,
          usageLimit: parsedUsageLimit,
          perUserLimit: parsedPerUser,
          isActive,
        });
        toast.success(`Coupon "${cleanCode}" created successfully!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Coupon submit error:", err);
      toast.error(err.message || "Failed to save coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col gap-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F96176]/10 text-[#F96176] flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? "Edit Promotional Coupon" : "Create New Coupon"}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure platform promo codes, audience limits, and universal discount rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Code & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. SAVE20, TRENO100"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm font-black uppercase tracking-wider text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 focus:border-[#F96176]"
                />
                <Tag size={15} className="absolute right-3 top-3 text-gray-400" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Unique uppercase promotional code</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Description / Title
              </label>
              <input
                type="text"
                placeholder="e.g. 20% off all roadside assistance"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 focus:border-[#F96176]"
              />
              <p className="text-[11px] text-gray-400 mt-1">Internal note or customer promo banner</p>
            </div>
          </div>

          {/* 2. Target Audience Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Target Audience (Kiske liye bana rahe hain?) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Mechanic */}
              <button
                type="button"
                onClick={() => setTargetAudience("mechanic")}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                  targetAudience === "mechanic"
                    ? "border-[#F96176] bg-[#F96176]/5 text-gray-900 ring-2 ring-[#F96176]/20"
                    : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    targetAudience === "mechanic"
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Wrench size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">Mechanics Only</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    Shops, workshops & technicians
                  </div>
                </div>
              </button>

              {/* Owner / Driver */}
              <button
                type="button"
                onClick={() => setTargetAudience("owner_driver")}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                  targetAudience === "owner_driver"
                    ? "border-[#F96176] bg-[#F96176]/5 text-gray-900 ring-2 ring-[#F96176]/20"
                    : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    targetAudience === "owner_driver"
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Truck size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">Drivers & Owners</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    Fleet carriers & drivers
                  </div>
                </div>
              </button>

              {/* Both */}
              <button
                type="button"
                onClick={() => setTargetAudience("both")}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                  targetAudience === "both"
                    ? "border-[#F96176] bg-[#F96176]/5 text-gray-900 ring-2 ring-[#F96176]/20"
                    : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    targetAudience === "both"
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">Both (All Users)</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    Universal across platform
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Discount Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType("percentage")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    discountType === "percentage"
                      ? "bg-[#F96176] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Percent size={14} />
                  <span>Percentage (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("flat")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    discountType === "flat"
                      ? "bg-[#F96176] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <DollarSign size={14} />
                  <span>Flat Amount ($)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={discountType === "percentage" ? 100 : undefined}
                  required
                  placeholder={discountType === "percentage" ? "e.g. 2 for 2%" : "e.g. 25 for $25"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 focus:border-[#F96176]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                  {discountType === "percentage" ? "%" : "USD"}
                </span>
              </div>
            </div>
          </div>

          {/* 4. "No Limit" Feature Card (CRITICAL USER REQUIREMENT) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isNoLimit
                ? "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-emerald-300 ring-2 ring-emerald-500/10"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    isNoLimit ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <InfinityIcon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900">
                      No Limit (Universal Amount Application)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isNoLimit
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isNoLimit ? "Active • No Minimum / No Cap" : "Custom Limits"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Jab yeh checkbox enable hoga, tab chahe bill <strong>$1</strong> ho ya{" "}
                    <strong>$10,000</strong>, coupon ka exact discount (e.g.{" "}
                    <span className="font-bold text-emerald-700">
                      {discountValue || "2"}
                      {discountType === "percentage" ? "%" : "$"}
                    </span>
                    ) bina kisi limit ke poora apply hoga.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={isNoLimit}
                  onChange={(e) => setIsNoLimit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* If NOT No Limit: Show Min & Max Limit Inputs */}
            {!isNoLimit && (
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Minimum Spend Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 50 (Orders below $50 rejected)"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Order must be at least this value</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Maximum Discount Cap ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 100 (Max savings capped at $100)"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Maximum dollar discount allowable</p>
                </div>
              </div>
            )}
          </div>

          {/* 5. Validity Dates & Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">Expiry Date</label>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={neverExpires}
                    onChange={(e) => setNeverExpires(e.target.checked)}
                    className="rounded text-[#F96176] focus:ring-[#F96176]"
                  />
                  <span>Never Expires</span>
                </label>
              </div>
              <input
                type="date"
                disabled={neverExpires}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 ${
                  neverExpires ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-gray-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Total Redemptions Limit (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100 (Empty = Unlimited uses)"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30"
              />
            </div>
          </div>

          {/* 6. Active Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <div className="text-xs font-bold text-gray-900">Coupon Status</div>
              <div className="text-[11px] text-gray-500">
                {isActive ? "Active and redeemable at checkout" : "Disabled / Inactive"}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#58BB87]"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs shadow-md shadow-[#F96176]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Coupon...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>{isEditing ? "Update Coupon" : "Create Coupon"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
