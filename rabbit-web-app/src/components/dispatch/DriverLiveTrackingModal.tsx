"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  X,
  Navigation,
  Clock,
  Gauge,
  User,
  Truck,
  Phone,
  Radio,
  MapPin,
} from "lucide-react";

interface DriverLiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  loadNumber?: string;
  vehicleNumber?: string;
  customerName?: string;
  pickupLocation?: string;
  dropLocation?: string;
}

interface DriverTelemetry {
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmph?: number;
  accuracy?: number;
  isTrackingActive?: boolean;
  activeLoadId?: string;
  loadNumber?: string;
  vehicleNumber?: string;
  driverPhone?: string;
  lastUpdated?: { seconds: number; nanoseconds: number };
}

const GOOGLE_LIBRARIES: "places"[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

export default function DriverLiveTrackingModal({
  isOpen,
  onClose,
  driverId,
  driverName = "Driver",
  driverPhone = "",
  loadNumber = "",
  vehicleNumber = "",
  customerName = "",
  pickupLocation = "",
  dropLocation = "",
}: DriverLiveTrackingModalProps) {
  const [telemetry, setTelemetry] = useState<DriverTelemetry | null>(null);
  const [historyPoints, setHistoryPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(defaultCenter);
  const mapRef = useRef<google.maps.Map | null>(null);

  const googleApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBLGQtovhzlh1ou14eKhNMOYK8uT2DfiW4";

  const { isLoaded: isLoaderLoaded } = useJsApiLoader({
    id: "script-loader",
    googleMapsApiKey: googleApiKey,
    libraries: GOOGLE_LIBRARIES,
  });

  const isLoaded =
    isLoaderLoaded ||
    (typeof window !== "undefined" && !!window.google?.maps);

  // Listen to DriverLocations/{driverId}
  useEffect(() => {
    if (!isOpen || !driverId) return;

    const unsubDriver = onSnapshot(doc(db, "DriverLocations", driverId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DriverTelemetry;
        setTelemetry(data);
        if (data.latitude && data.longitude) {
          const pos = { lat: data.latitude, lng: data.longitude };
          setMapCenter(pos);
          if (mapRef.current) {
            mapRef.current.panTo(pos);
          }
        }
      }
    });

    return () => unsubDriver();
  }, [isOpen, driverId]);

  // Listen to ActiveLoadLocations/{loadId}/History
  useEffect(() => {
    if (!isOpen || !telemetry?.activeLoadId) return;

    const historyRef = collection(
      db,
      "ActiveLoadLocations",
      telemetry.activeLoadId,
      "History"
    );
    const q = query(historyRef, orderBy("recordedAt", "asc"));

    const unsubHistory = onSnapshot(q, (snap) => {
      const points: { lat: number; lng: number }[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.latitude && d.longitude) {
          points.push({ lat: d.latitude, lng: d.longitude });
        }
      });
      setHistoryPoints(points);
    });

    return () => unsubHistory();
  }, [isOpen, telemetry?.activeLoadId]);

  if (!isOpen) return null;

  const formatLastPing = (lastUpdated?: { seconds: number }) => {
    if (!lastUpdated) return "No signal yet";
    const date = new Date(lastUpdated.seconds * 1000);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isLive = telemetry?.isTrackingActive === true;
  const currentSpeed = telemetry?.speedKmph ?? 0;
  const activeLoad = telemetry?.loadNumber || loadNumber;
  const activeVehicle = telemetry?.vehicleNumber || vehicleNumber;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-[#58BB87] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Live Tracking: {driverName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isLive
                      ? "bg-white text-[#20593b]"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  <Radio className="w-3 h-3 animate-pulse text-[#58BB87]" />
                  {isLive ? "Live (5m sync)" : "Tracking Inactive"}
                </span>
              </div>
              <p className="text-xs text-white/90">
                {activeLoad ? `Load: ${activeLoad}` : "Active Dispatch Telemetry"}
                {customerName ? ` • Customer: ${customerName}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map & Telemetry Container */}
        <div className="flex-1 relative flex flex-col">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={telemetry?.latitude ? 14 : 5}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {/* Live Driver Marker */}
              {telemetry?.latitude && telemetry?.longitude && (
                <Marker
                  position={{
                    lat: telemetry.latitude,
                    lng: telemetry.longitude,
                  }}
                  title={driverName}
                  icon={
                    typeof window !== "undefined" &&
                    window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW !==
                      undefined
                      ? {
                          path: window.google.maps.SymbolPath
                            .FORWARD_CLOSED_ARROW,
                          scale: 6,
                          fillColor: "#58BB87",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                          rotation: telemetry.heading || 0,
                        }
                      : undefined
                  }
                />
              )}

              {/* Traveled Route Polyline */}
              {historyPoints.length > 1 && (
                <Polyline
                  path={historyPoints}
                  options={{
                    strokeColor: "#58BB87",
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
              Loading Google Maps...
            </div>
          )}

          {/* Floating Telemetry Info Box */}
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80 p-4 space-y-3 z-10">
            {/* Speed & Heartbeat */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#58BB87]/15 text-[#58BB87] flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Speed</div>
                  <div className="text-base font-bold text-gray-900">
                    {currentSpeed.toFixed(0)} <span className="text-xs font-normal text-gray-500">km/h</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="text-xs text-gray-500 font-medium">Last Ping</div>
                  <div className="text-xs font-semibold text-gray-800 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-[#58BB87]" />
                    {formatLastPing(telemetry?.lastUpdated)}
                  </div>
                </div>
              </div>
            </div>

            {/* Driver & Vehicle Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-xl">
                <User className="w-4 h-4 text-[#58BB87] flex-shrink-0" />
                <span className="truncate font-semibold">{driverName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-xl">
                <Truck className="w-4 h-4 text-[#58BB87] flex-shrink-0" />
                <span className="truncate font-semibold">
                  {activeVehicle || "No Vehicle"}
                </span>
              </div>
            </div>

            {/* Route Stops */}
            {(pickupLocation || dropLocation) && (
              <div className="space-y-1 text-xs pt-1 border-t">
                {pickupLocation && (
                  <div className="flex items-start gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="truncate">
                      <strong className="text-gray-800">From:</strong> {pickupLocation}
                    </span>
                  </div>
                )}
                {dropLocation && (
                  <div className="flex items-start gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="truncate">
                      <strong className="text-gray-800">To:</strong> {dropLocation}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#58BB87]" />
            Location refreshes automatically in real-time from mobile telemetry
          </div>
          <div className="flex items-center gap-2">
            {driverPhone && (
              <a
                href={`tel:${driverPhone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#58BB87] hover:bg-[#4aa975] text-white rounded-xl shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Driver
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-medium border border-gray-300 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
