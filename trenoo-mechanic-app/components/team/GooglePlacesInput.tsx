"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export interface SelectedPlaceData {
  formattedAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface GooglePlacesInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (data: SelectedPlaceData) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapsPlacesCallback?: () => void;
  }
}

export default function GooglePlacesInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search US city, state or address...",
  className = "",
  required = false,
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // 1. Dynamically load Google Maps script with Places library
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
      return;
    }

    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
      "";

    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_API_KEY is not configured.");
      return;
    }

    const existingScript = document.getElementById("google-maps-places-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-places-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => {
        setIsScriptLoaded(true);
      });
    }
  }, []);

  // 2. Initialize Autocomplete restricted to US
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || !window.google?.maps?.places) return;

    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      fields: ["address_components", "geometry", "formatted_address", "name"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const components = place.address_components || [];

      let streetNumber = "";
      let route = "";
      let city = "";
      let state = "";
      let postalCode = "";
      let country = "USA";

      components.forEach((c: any) => {
        const types = c.types;
        if (types.includes("street_number")) {
          streetNumber = c.long_name;
        } else if (types.includes("route")) {
          route = c.long_name;
        } else if (
          types.includes("locality") ||
          types.includes("sublocality") ||
          types.includes("postal_town")
        ) {
          if (!city) city = c.long_name;
        } else if (types.includes("administrative_area_level_2") && !city) {
          city = c.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = c.short_name; // e.g. TX, CA, NY
        } else if (types.includes("postal_code")) {
          postalCode = c.long_name;
        } else if (types.includes("country")) {
          country = c.short_name || "US";
        }
      });

      const streetAddress = `${streetNumber} ${route}`.trim() || place.name || "";
      const formattedAddress = place.formatted_address || `${city}, ${state} USA`;

      onPlaceSelect({
        formattedAddress,
        streetAddress,
        city: city || place.name || "USA City",
        state: state || "",
        postalCode,
        country,
        latitude: lat,
        longitude: lng,
      });

      onChange(formattedAddress);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isScriptLoaded, onChange, onPlaceSelect]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]/20 transition ${className}`}
        />
        {!isScriptLoaded && (
          <Loader2 className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>
    </div>
  );
}
