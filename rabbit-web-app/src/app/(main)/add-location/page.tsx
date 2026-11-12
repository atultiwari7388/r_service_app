"use client";

import React, { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import {
  MapPin,
  Navigation,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Globe,
  ShieldAlert,
  ArrowLeft,
  Check,
  HelpCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  collection,
  doc,
  writeBatch,
  query,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";

const libraries: ["places"] = ["places"];

// In-memory cache for reverse geocoding
const addLocationGeocodeCache = new Map<string, google.maps.LatLngLiteral>();

// IP Geolocation Fallback
const detectLocationFromIP = async (): Promise<{
  address: string;
  lat: number;
  lng: number;
} | null> => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const data = await res.json();
      if (data && data.city && data.latitude && data.longitude) {
        const address = [data.city, data.region, data.country_name || data.country]
          .filter(Boolean)
          .join(", ");
        return {
          address: address || `${data.latitude}, ${data.longitude}`,
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        };
      }
    }
  } catch (e) {
    console.warn("ipapi.co fallback failed:", e);
  }

  try {
    const res = await fetch("https://ipwho.is/");
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        const address = [data.city, data.region, data.country]
          .filter(Boolean)
          .join(", ");
        return {
          address: address || `${data.latitude}, ${data.longitude}`,
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        };
      }
    }
  } catch (e) {
    console.warn("ipwho.is fallback failed:", e);
  }

  return null;
};

function AddLocationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/find-mechanic";

  const { user } = useAuth() || { user: null };
  const currentUserId = user?.uid;

  const [selectedLocation, setSelectedLocation] = useState("");
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 39.8283, // Center of North America (freight corridor default)
    lng: -98.5795,
  });

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showChromeGuide, setShowChromeGuide] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(
    currentUserId || null
  );

  const mapRef = useRef<google.maps.Map | null>(null);
  const autoDetectAttempted = useRef(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    libraries,
  });

  // Sync effective user id
  useEffect(() => {
    if (!currentUserId) {
      setEffectiveUserId(null);
      return;
    }

    setEffectiveUserId(currentUserId);

    const checkSubOwner = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", currentUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.role === "SubOwner" && data?.createdBy) {
            setEffectiveUserId(data.createdBy);
          }
        }
      } catch (err) {
        console.warn("Error verifying user role:", err);
      }
    };

    checkSubOwner();
  }, [currentUserId]);

  // Check browser permission status
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as any })
        .then((permission) => {
          if (permission.state === "denied") {
            setLocationPermissionDenied(true);
          }
          permission.onchange = () => {
            if (permission.state === "granted") {
              setLocationPermissionDenied(false);
              setShowChromeGuide(false);
            } else if (permission.state === "denied") {
              setLocationPermissionDenied(true);
            }
          };
        })
        .catch(() => {
          // Permissions API not supported for geolocation in some environments
        });
    }
  }, []);

  // Reverse Geocode using Google Maps JS API (CORS-free in browser) or BigDataCloud fallback
  const fetchAddressFromLatLng = async (lat: number, lng: number): Promise<string> => {
    // 1. Google Maps Geocoder
    if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results.length > 0) {
          const address = response.results[0].formatted_address;
          setSelectedLocation(address);
          setSearchInput(address);
          return address;
        }
      } catch (e) {
        console.warn("Google Geocoder reverse geocode warning:", e);
      }
    }

    // 2. BigDataCloud reverse geocode (Free & CORS-safe for browser)
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const parts = [
          data.locality || data.city,
          data.principalSubdivision || data.region,
          data.countryName,
        ].filter(Boolean);
        if (parts.length > 0) {
          const address = parts.join(", ");
          setSelectedLocation(address);
          setSearchInput(address);
          return address;
        }
      }
    } catch (e) {
      console.warn("BigDataCloud reverse geocode warning:", e);
    }

    const fallback = `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setSelectedLocation(fallback);
    setSearchInput(fallback);
    return fallback;
  };

  // Precise Geolocation Detection
  const getUserLocation = useCallback(
    async (isManual = false) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        toast.error("Geolocation is not supported by this browser.");
        const ipRes = await detectLocationFromIP();
        if (ipRes) {
          const ipPos = { lat: ipRes.lat, lng: ipRes.lng };
          setMapCenter(ipPos);
          setMarkerPosition(ipPos);
          setSelectedLocation(ipRes.address);
          setSearchInput(ipRes.address);
        }
        return;
      }

      setIsFetchingLocation(true);

      const queryPosition = (enableHighAccuracy: boolean, timeout: number) =>
        new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy,
            timeout,
            maximumAge: enableHighAccuracy ? 0 : 300000,
          });
        });

      let position: GeolocationPosition | null = null;

      try {
        // Tier 1: High accuracy GPS (precise pinpoint)
        position = await queryPosition(true, 7000);
        setLocationPermissionDenied(false);
      } catch (err: any) {
        if (err.code === 1) {
          // PERMISSION_DENIED in Chrome / Browser
          console.warn("Location permission denied in browser:", err.message);
          setLocationPermissionDenied(true);
        } else {
          // Timeout or position unavailable -> Tier 2: Low accuracy fallback
          console.warn("High accuracy GPS timed out, trying standard accuracy:", err.message);
          try {
            position = await queryPosition(false, 5000);
            setLocationPermissionDenied(false);
          } catch (err2: any) {
            if (err2.code === 1) {
              setLocationPermissionDenied(true);
            }
            console.warn("Standard accuracy also failed:", err2.message);
          }
        }
      }

      if (position) {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(userLoc);
        setMarkerPosition(userLoc);
        if (mapRef.current) {
          mapRef.current.panTo(userLoc);
          mapRef.current.setZoom(16);
        }
        const address = await fetchAddressFromLatLng(userLoc.lat, userLoc.lng);
        if (isManual) {
          toast.success("Precise location found!");
        }
      } else {
        // Tier 3: IP Location fallback so Chrome users aren't left stranded
        const ipRes = await detectLocationFromIP();
        if (ipRes) {
          const ipPos = { lat: ipRes.lat, lng: ipRes.lng };
          setMapCenter(ipPos);
          setMarkerPosition(ipPos);
          setSelectedLocation(ipRes.address);
          setSearchInput(ipRes.address);
          if (mapRef.current) {
            mapRef.current.panTo(ipPos);
            mapRef.current.setZoom(13);
          }
          if (isManual) {
            toast("Using approximate location based on your network.", { icon: "🌐" });
          }
        } else if (isManual) {
          toast.error("Could not fetch location. Please search your address above.");
        }
      }

      setIsFetchingLocation(false);
    },
    []
  );

  // Auto detect once loaded
  useEffect(() => {
    if (isLoaded && !autoDetectAttempted.current) {
      autoDetectAttempted.current = true;
      getUserLocation(false);
    }
  }, [isLoaded, getUserLocation]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });
    await fetchAddressFromLatLng(lat, lng);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const term = searchInput.trim();

    // Check Google Geocoder
    if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ address: term });
        if (response.results && response.results[0]) {
          const loc = response.results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          const formatted = response.results[0].formatted_address || term;
          setMarkerPosition(coords);
          setSelectedLocation(formatted);
          setSearchInput(formatted);
          if (mapRef.current) {
            mapRef.current.panTo(coords);
            mapRef.current.setZoom(15);
          }
          toast.success("Location found on map!");
          return;
        }
      } catch (err) {
        console.warn("Geocoding search warning:", err);
      }
    }

    // Direct fallback
    setSelectedLocation(term);
    toast.success("Location set manually.");
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation && !markerPosition) {
      toast.error("Please pick a location on the map or type an address.");
      return;
    }

    const finalAddress = selectedLocation || searchInput.trim();
    const finalCoords = markerPosition || mapCenter;

    if (!finalAddress) {
      toast.error("Please enter a valid address");
      return;
    }

    setIsSaving(true);
    try {
      const activeAuthUser = auth.currentUser;
      const targetUid = effectiveUserId || activeAuthUser?.uid;

      if (activeAuthUser && targetUid) {
        // Authenticated fleet user flow -> Save to Firestore
        const batch = writeBatch(db);
        const userAddressesRef = collection(db, "Users", targetUid, "Addresses");

        const existingAddresses = await getDocs(query(userAddressesRef));
        existingAddresses.forEach((d) => {
          batch.update(d.ref, { isAddressSelected: false });
        });

        const newAddressRef = doc(userAddressesRef);
        batch.set(newAddressRef, {
          address: finalAddress,
          addressType: "Service Location",
          date: new Date().toISOString(),
          id: newAddressRef.id,
          isAddressSelected: true,
          location: {
            latitude: finalCoords.lat,
            longitude: finalCoords.lng,
          },
        });

        await batch.commit();
        toast.success("Location saved to your profile!");
      } else {
        // Guest user flow
        toast.success("Location selected successfully!");
      }

      // Store in localStorage for immediate auto-fill in BookService / Find Mechanic
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "selectedBookingLocation",
          JSON.stringify({
            address: finalAddress,
            lat: finalCoords.lat,
            lng: finalCoords.lng,
            timestamp: Date.now(),
          })
        );
      }

      // Smooth redirect back
      router.push(redirectParam);
    } catch (err: any) {
      console.error("Error saving location:", err);
      toast.error("Failed to save location. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Failed to Load Google Maps
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Could not connect to Google Maps. Please check your internet connection and refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#F96176] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#e04f63] transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
          <RefreshCw className="w-5 h-5 text-[#F96176] animate-spin" />
          <span className="text-sm font-bold text-gray-800">
            Loading Google Maps...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(redirectParam)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F96176]" />
              Select Service Location
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Click anywhere on the map or type an address below to pinpoint your breakdown
            </p>
          </div>
        </div>

        {/* Live GPS Trigger Button */}
        <button
          type="button"
          onClick={() => getUserLocation(true)}
          disabled={isFetchingLocation}
          className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[#F96176] hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Detect my current location"
        >
          <Navigation
            className={`w-3.5 h-3.5 ${isFetchingLocation ? "animate-spin" : ""}`}
          />
          <span>{isFetchingLocation ? "Detecting GPS..." : "My GPS"}</span>
        </button>
      </div>

      {/* Chrome / Browser Permission Notification Banner */}
      {locationPermissionDenied && (
        <div className="mb-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Location Permission is Blocked in Chrome
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Chrome has location access blocked for this site. You can allow it in Chrome settings, or search your address manually.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => getUserLocation(true)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Allow / Retry GPS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChromeGuide(!showChromeGuide)}
                    className="px-3 py-1 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {showChromeGuide ? "Hide Chrome Guide" : "How to Enable in Chrome 🔒"}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLocationPermissionDenied(false)}
              className="text-amber-500 hover:text-amber-800 p-1 text-xs"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Detailed Chrome Permission Instructions Accordion */}
          {showChromeGuide && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-amber-950">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="font-bold block mb-1">💻 Chrome on Desktop:</span>
                1. Click the <b>Tune / Lock icon 🔒</b> on the left of the address bar.<br />
                2. Switch <b>Location</b> to <b>Allow</b>.<br />
                3. Click &quot;Allow / Retry GPS&quot; above.
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="font-bold block mb-1">📱 Chrome on Android:</span>
                1. Tap the <b>⋮ (3 dots)</b> or Lock icon.<br />
                2. Tap <b>Site Settings → Location</b>.<br />
                3. Choose <b>Allow</b> and reload.
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="font-bold block mb-1">🍎 Chrome on iPhone / iOS:</span>
                1. Open iOS <b>Settings → Chrome</b>.<br />
                2. Tap <b>Location → While Using App</b>.<br />
                3. Turn <b>Precise Location ON</b>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 mb-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search address, landmark, highway exit, city..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-xs font-semibold text-gray-800"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSelectedLocation("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Selected location summary banner */}
        {selectedLocation && (
          <div className="mt-3 p-3 bg-rose-50/70 border border-rose-100 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F96176] min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#58BB87]" />
              <span className="truncate">{selectedLocation}</span>
            </div>
            {markerPosition && (
              <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                {markerPosition.lat.toFixed(4)}, {markerPosition.lng.toFixed(4)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactive Google Map */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden relative mb-6">
        <div className="relative w-full h-[460px] sm:h-[520px]">
          <GoogleMap
            onClick={handleMapClick}
            onLoad={onMapLoad}
            center={markerPosition || mapCenter}
            zoom={markerPosition ? 16 : 13}
            mapContainerStyle={{ height: "100%", width: "100%" }}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
            }}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                animation={google.maps.Animation.DROP}
              />
            )}
          </GoogleMap>

          {/* Floating Live GPS detection pill */}
          {isFetchingLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xs text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-pulse z-10">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F96176]" />
              <span>Detecting precise GPS coordinates...</span>
            </div>
          )}

          {/* Floating Current Location Re-center button */}
          <button
            type="button"
            onClick={() => getUserLocation(true)}
            className="absolute bottom-6 right-6 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-2xl shadow-xl border border-gray-200 transition cursor-pointer flex items-center gap-2 z-10 font-bold text-xs active:scale-95"
            title="Snap to my current GPS location"
          >
            <Navigation className="w-4 h-4 text-[#F96176]" />
            <span className="hidden sm:inline">Snap to My GPS</span>
          </button>
        </div>
      </div>

      {/* Save / Apply Location Button */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-gray-500 font-medium block">
            Target Location:
          </span>
          <p className="text-sm font-extrabold text-gray-900 line-clamp-1">
            {selectedLocation || searchInput || "No location picked yet"}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.push(redirectParam)}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={isSaving || (!selectedLocation && !searchInput.trim())}
            className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Location...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm & Use Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddLocationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
            <RefreshCw className="w-5 h-5 text-[#F96176] animate-spin" />
            <span className="text-sm font-bold text-gray-800">
              Loading Location Manager...
            </span>
          </div>
        </div>
      }
    >
      <AddLocationContent />
    </Suspense>
  );
}
