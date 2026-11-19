"use client";

import React, { useState, useEffect } from "react";
import { X, Truck, DollarSign, Save, Info, RefreshCw, CheckCircle2 } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  GlobalVehiclePricingConfig,
  DEFAULT_GLOBAL_VEHICLE_PRICING,
} from "@/types/subscription";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (config: GlobalVehiclePricingConfig) => void;
}

export default function GlobalVehiclePricingModal({
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [truckPrice, setTruckPrice] = useState<string>("10");
  const [trailerPrice, setTrailerPrice] = useState<string>("6");
  const [cadMult, setCadMult] = useState<string>("1.35");
  const [mxnMult, setMxnMult] = useState<string>("18.0");
  const [gbpMult, setGbpMult] = useState<string>("0.8");
  const [audMult, setAudMult] = useState<string>("1.5");
  const [lastUpdated, setLastUpdated] = useState<any>(null);

  // Fetch current global pricing configuration
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "appSettings", "globalVehiclePricing"));
        if (snap.exists() && isMounted) {
          const data = snap.data() as GlobalVehiclePricingConfig;
          setTruckPrice(String(data.truckPriceUSD ?? 10));
          setTrailerPrice(String(data.trailerPriceUSD ?? 6));
          if (data.currencyMultipliers) {
            setCadMult(String(data.currencyMultipliers.CAD ?? 1.35));
            setMxnMult(String(data.currencyMultipliers.MXN ?? 18.0));
            setGbpMult(String(data.currencyMultipliers.GBP ?? 0.8));
            setAudMult(String(data.currencyMultipliers.AUD ?? 1.5));
          }
          setLastUpdated(data.updatedAt);
        } else {
          // Defaults
          setTruckPrice("10");
          setTrailerPrice("6");
          setCadMult("1.35");
          setMxnMult("18.0");
          setGbpMult("0.8");
          setAudMult("1.5");
        }
      } catch (err) {
        console.error("Error fetching global vehicle pricing:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const tPrice = parseFloat(truckPrice);
    const trPrice = parseFloat(trailerPrice);

    if (isNaN(tPrice) || tPrice <= 0) {
      toast.error("Please enter a valid base price for 1 Truck");
      return;
    }
    if (isNaN(trPrice) || trPrice <= 0) {
      toast.error("Please enter a valid base price for 1 Trailer");
      return;
    }

    setSaving(true);
    try {
      const config: GlobalVehiclePricingConfig = {
        truckPriceUSD: tPrice,
        trailerPriceUSD: trPrice,
        currencyMultipliers: {
          CAD: parseFloat(cadMult) || 1.35,
          MXN: parseFloat(mxnMult) || 18.0,
          GBP: parseFloat(gbpMult) || 0.8,
          AUD: parseFloat(audMult) || 1.5,
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "appSettings", "globalVehiclePricing"), config, {
        merge: true,
      });

      toast.success(
        `Global vehicle pricing updated: $${tPrice}/truck & $${trPrice}/trailer.`
      );
      if (onUpdated) {
        onUpdated(config);
      }
      onClose();
    } catch (err: any) {
      console.error("Error saving global vehicle pricing:", err);
      toast.error(err?.message || "Failed to update global vehicle pricing");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/60 via-white to-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F96176] text-white flex items-center justify-center shadow-md shadow-[#F96176]/25">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Global Vehicle Base Pricing
              </h2>
              <p className="text-xs text-gray-500">
                Platform-wide unit baseline for 1 Truck & 1 Trailer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-6 h-6 text-[#F96176] animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-semibold">
                Loading current baseline rates...
              </p>
            </div>
          ) : (
            <>
              {/* Informational Callout */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-gray-700">
                <Info className="w-4 h-4 text-[#F96176] shrink-0 mt-0.5" />
                <span>
                  Updating these base rates automatically recalculates default amounts when creating new vehicle slabs. Existing published active subscriptions will remain unaffected.
                </span>
              </div>

              {/* Base Prices: Truck & Trailer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Truck Unit Price */}
                <div className="p-4 rounded-xl border-2 border-rose-100 bg-white hover:border-[#F96176]/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#F96176]" /> 1 Truck Rate
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-[#F96176]">
                      Power Unit
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={truckPrice}
                      onChange={(e) => setTruckPrice(e.target.value)}
                      placeholder="10.00"
                      className="w-full pl-7 pr-12 py-2 rounded-lg border border-gray-300 text-base font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F96176]/30 focus:border-[#F96176]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                      / month
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Standard baseline cost for 1 registered truck.
                  </p>
                </div>

                {/* Trailer Unit Price */}
                <div className="p-4 rounded-xl border-2 border-emerald-100 bg-white hover:border-[#58BB87]/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#58BB87]" /> 1 Trailer Rate
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#58BB87]">
                      Trailing Unit
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={trailerPrice}
                      onChange={(e) => setTrailerPrice(e.target.value)}
                      placeholder="6.00"
                      className="w-full pl-7 pr-12 py-2 rounded-lg border border-gray-300 text-base font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#58BB87]/30 focus:border-[#58BB87]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                      / month
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Standard baseline cost for 1 registered trailer.
                  </p>
                </div>
              </div>

              {/* Currency Multipliers (Optional Advanced) */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Currency Conversion Multipliers
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Relative to USD ($1.00)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      🇨🇦 CAD
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cadMult}
                      onChange={(e) => setCadMult(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      🇲🇽 MXN
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={mxnMult}
                      onChange={(e) => setMxnMult(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      🇬🇧 GBP
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={gbpMult}
                      onChange={(e) => setGbpMult(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      🇦🇺 AUD
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={audMult}
                      onChange={(e) => setAudMult(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#F96176] hover:bg-[#e04f63] shadow-md shadow-[#F96176]/25 transition flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Base Rates
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
