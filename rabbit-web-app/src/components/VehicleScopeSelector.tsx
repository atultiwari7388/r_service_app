"use client";

import React from "react";
import { Car, Truck } from "lucide-react";

export type VehicleScope = "my" | "carrier";

interface VehicleScopeSelectorProps {
  value: VehicleScope;
  onChange: (scope: VehicleScope) => void;
  myCount?: number;
  carrierCount?: number;
  className?: string;
  size?: "sm" | "md";
}

export default function VehicleScopeSelector({
  value,
  onChange,
  myCount,
  carrierCount,
  className = "",
  size = "md",
}: VehicleScopeSelectorProps) {
  const isSm = size === "sm";

  return (
    <div
      className={`inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200/80 shadow-inner ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange("my")}
        className={`flex items-center gap-2 rounded-lg font-semibold transition-all ${
          isSm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        } ${
          value === "my"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <Car className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>My Vehicles</span>
        {typeof myCount === "number" && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              value === "my"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {myCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("carrier")}
        className={`flex items-center gap-2 rounded-lg font-semibold transition-all ${
          isSm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        } ${
          value === "carrier"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <Truck className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>Carrier Vehicles</span>
        {typeof carrierCount === "number" && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              value === "carrier"
                ? "bg-emerald-800 text-emerald-100"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {carrierCount}
          </span>
        )}
      </button>
    </div>
  );
}
