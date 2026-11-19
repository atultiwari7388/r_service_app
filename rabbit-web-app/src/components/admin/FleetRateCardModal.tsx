"use client";

import React, { useState } from "react";
import { X, Truck, Tag, Check, Sparkles, ArrowRight } from "lucide-react";
import {
  FLEET_PRICING_TIERS,
  FleetTierPricing,
} from "@/types/fleetPricingSheet";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier?: (tier: FleetTierPricing, scope: "truck_only" | "trailer_only", duration: "Monthly" | "Yearly") => void;
}

export default function FleetRateCardModal({
  isOpen,
  onClose,
  onSelectTier,
}: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "trucks" | "trailers">("all");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rose-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F96176] text-white flex items-center justify-center shadow-md shadow-[#F96176]/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Official Fleet Pricing Matrix & Rate Card
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  Rate Card
                </span>
              </div>
              <p className="text-xs text-gray-500">
                10 Fleet Tiers (1 to 200 units) with Monthly, Yearly, and Promo Discount Pricing (Coupons: TRENO100, TRENO50).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Promo Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 bg-gray-50/80 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Vehicles (Complete Matrix)" },
              { id: "trucks", label: "Trucks Only" },
              { id: "trailers", label: "Trailers Only" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-[#F96176] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Coupon Info Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-500">Active Coupons:</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
              TRENO100 (100% Free)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> TRENO50 (50% Off Yearly)
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/90 text-gray-700 font-bold border-b border-gray-300">
                <th className="py-3 px-3 rounded-tl-lg font-black text-gray-900">
                  FLEET RANGE
                </th>
                {(activeTab === "all" || activeTab === "trucks") && (
                  <>
                    <th className="py-3 px-3 text-[#F96176]">
                      MONTHLY TRUCK
                    </th>
                    <th className="py-3 px-3 text-[#F96176]">
                      YEARLY TRUCK
                    </th>
                  </>
                )}
                {(activeTab === "all" || activeTab === "trailers") && (
                  <>
                    <th className="py-3 px-3 text-emerald-700">
                      MONTHLY TRAILER
                    </th>
                    <th className="py-3 px-3 text-emerald-700">
                      YEARLY TRAILER
                    </th>
                  </>
                )}
                <th className="py-3 px-3 text-center text-amber-800">
                  DISCOUNT COUPONS
                </th>
                {(activeTab === "all" || activeTab === "trucks") && (
                  <th className="py-3 px-3 text-emerald-900 bg-emerald-50/70 font-black">
                    AFTER DISCOUNT (YEARLY TRUCK)
                  </th>
                )}
                {(activeTab === "all" || activeTab === "trailers") && (
                  <th className="py-3 px-3 text-emerald-900 bg-emerald-50/70 font-black">
                    AFTER DISCOUNT (YEARLY TRAILER)
                  </th>
                )}
                {onSelectTier && (
                  <th className="py-3 px-3 text-right rounded-tr-lg">
                    ACTION
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {FLEET_PRICING_TIERS.map((tier, idx) => (
                <tr
                  key={tier.tierId}
                  className={`hover:bg-rose-50/30 transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  {/* Fleet Range */}
                  <td className="py-3 px-3 font-black text-gray-900 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 font-mono font-bold text-xs border border-gray-300">
                      {tier.label}
                    </span>
                  </td>

                  {/* Monthly Truck */}
                  {(activeTab === "all" || activeTab === "trucks") && (
                    <td className="py-3 px-3 font-extrabold text-gray-900 whitespace-nowrap">
                      ${tier.monthlyTruckPrice}
                      <span className="text-[10px] text-gray-400 font-normal"> /mo</span>
                    </td>
                  )}

                  {/* Yearly Truck */}
                  {(activeTab === "all" || activeTab === "trucks") && (
                    <td className="py-3 px-3 font-extrabold text-gray-900 whitespace-nowrap">
                      ${tier.yearlyTruckPrice}
                      <span className="text-[10px] text-gray-400 font-normal"> /yr</span>
                    </td>
                  )}

                  {/* Monthly Trailer */}
                  {(activeTab === "all" || activeTab === "trailers") && (
                    <td className="py-3 px-3 font-extrabold text-gray-900 whitespace-nowrap">
                      ${tier.monthlyTrailerPrice}
                      <span className="text-[10px] text-gray-400 font-normal"> /mo</span>
                    </td>
                  )}

                  {/* Yearly Trailer */}
                  {(activeTab === "all" || activeTab === "trailers") && (
                    <td className="py-3 px-3 font-extrabold text-gray-900 whitespace-nowrap">
                      ${tier.yearlyTrailerPrice}
                      <span className="text-[10px] text-gray-400 font-normal"> /yr</span>
                    </td>
                  )}

                  {/* Coupons */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        TRENO100
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        TRENO50
                      </span>
                    </div>
                  </td>

                  {/* After Discount - Yearly Truck */}
                  {(activeTab === "all" || activeTab === "trucks") && (
                    <td className="py-3 px-3 font-black text-emerald-700 bg-emerald-50/40 whitespace-nowrap">
                      ${tier.discountedYearlyTruckPrice}
                      <span className="text-[10px] text-emerald-600 font-semibold"> (50% Off)</span>
                    </td>
                  )}

                  {/* After Discount - Yearly Trailer */}
                  {(activeTab === "all" || activeTab === "trailers") && (
                    <td className="py-3 px-3 font-black text-emerald-700 bg-emerald-50/40 whitespace-nowrap">
                      ${tier.discountedYearlyTrailerPrice}
                      <span className="text-[10px] text-emerald-600 font-semibold"> (50% Off)</span>
                    </td>
                  )}

                  {/* Action Button */}
                  {onSelectTier && (
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTier(
                              tier,
                              activeTab === "trailers" ? "trailer_only" : "truck_only",
                              "Monthly"
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F96176] text-white hover:bg-[#e04f63] shadow-xs transition"
                          title="Apply as Monthly Plan"
                        >
                          Use Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTier(
                              tier,
                              activeTab === "trailers" ? "trailer_only" : "truck_only",
                              "Yearly"
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-900 text-white hover:bg-black shadow-xs transition"
                          title="Apply as Yearly Plan"
                        >
                          Use Yearly
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            💡 All tiers map directly to Firestore plans for Owner-Operators & Fleet Carriers (type: <code>trenoops</code>).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
