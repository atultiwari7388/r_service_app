"use client";

import React, { useState } from "react";
import {
  MapPin,
  ExternalLink,
  Navigation,
  Compass,
  Radio,
  Truck,
  Check,
  Info,
} from "lucide-react";
import { DEMO_LOCATIONS, DemoLocation } from "@/data/mockServices";

export default function CurrentLocationCard() {
  const [currentLocation, setCurrentLocation] = useState<DemoLocation>(
    DEMO_LOCATIONS[0]
  );
  const [isChanging, setIsChanging] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSelectLocation = (loc: DemoLocation) => {
    setCurrentLocation(loc);
    setIsChanging(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentLocation.fullAddress);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Safe Google Maps link without API key
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    currentLocation.fullAddress
  )}`;

  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-7 relative overflow-hidden space-y-5">
      {/* Top Banner: Title & Sample Data Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-[#F96176] flex items-center justify-center font-bold">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Current Service Location
            </h2>
            <p className="text-xs text-gray-500">
              Assigned dispatch yard & primary operational coverage zone
            </p>
          </div>
        </div>

        {/* Clear Demo Label */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold self-start sm:self-auto">
          <Info size={13} className="text-amber-600" />
          <span>Static Demonstration Address</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Full Address & Coordinates Details */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Service Terminal / Hub
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 leading-snug">
                {currentLocation.fullAddress}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-semibold">
                Hub Zone: <span className="text-gray-900">{currentLocation.depotZone}</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                  <Compass size={11} className="text-[#58BB87]" /> Coordinates
                </span>
                <span className="text-xs font-mono font-bold text-gray-800 mt-0.5 block">
                  {currentLocation.coordinates}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                  <Radio size={11} className="text-[#F96176]" /> Coverage Radius
                </span>
                <span className="text-xs font-bold text-gray-800 mt-0.5 block">
                  {currentLocation.coverageRadius}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                  <Truck size={11} className="text-[#F96176]" /> Bay Capacity
                </span>
                <span className="text-xs font-bold text-[#58BB87] mt-0.5 block">
                  6 Commercial Bays Ready
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Change Location, View on Map, Copy */}
          <div className="flex items-center gap-2.5 flex-wrap pt-2">
            <button
              type="button"
              onClick={() => setIsChanging(!isChanging)}
              className="py-2.5 px-4 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Navigation size={13} className="text-white" />
              <span>Change Location (Demo)</span>
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>View on Map</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              {copySuccess ? (
                <>
                  <Check size={13} className="text-[#58BB87]" />
                  <span>Copied!</span>
                </>
              ) : (
                <span>Copy Address</span>
              )}
            </button>
          </div>

          {/* Interactive Demo Switcher Dropdown */}
          {isChanging && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-gray-700 block">
                Select a Demonstration Service Location:
              </span>
              <div className="space-y-1.5">
                {DEMO_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      currentLocation.id === loc.id
                        ? "bg-white text-[#F96176] font-bold border border-[#F96176]/30 shadow-xs"
                        : "bg-white/70 hover:bg-white text-gray-700 font-medium border border-gray-200"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-gray-900">{loc.name}</p>
                      <p className="text-[11px] text-gray-500">{loc.fullAddress}</p>
                    </div>
                    {currentLocation.id === loc.id && (
                      <Check size={14} className="text-[#F96176]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stylized Map Illustration & Dispatch Beacon */}
        <div className="lg:col-span-5 rounded-2xl bg-gray-50 border border-gray-200 p-5 text-gray-900 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
          {/* Map Top Status */}
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-gray-700">
              <span className="h-2 w-2 rounded-full bg-[#58BB87] animate-pulse" />
              Depot Active
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              GPS Reference Only
            </span>
          </div>

          {/* Center Map Pin Graphic */}
          <div className="relative z-10 my-4 text-center flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-12 w-12 rounded-full bg-[#F96176]/20 animate-ping" />
              <span className="relative h-10 w-10 rounded-2xl bg-[#F96176] text-white flex items-center justify-center shadow-md">
                <MapPin size={20} />
              </span>
            </div>
            <h4 className="text-sm font-black text-gray-900 mt-2">
              {currentLocation.name}
            </h4>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              {currentLocation.coordinates}
            </p>
          </div>

          {/* Bottom Dispatch Radius */}
          <div className="relative z-10 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
            <span>Fleet Coverage:</span>
            <span className="font-bold text-[#58BB87]">
              {currentLocation.coverageRadius}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
