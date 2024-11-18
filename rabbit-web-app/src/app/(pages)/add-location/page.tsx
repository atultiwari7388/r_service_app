"use client";

import React, { useState, useMemo } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import toast from "react-hot-toast";

const AddLocation = () => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries: ["places"] as ["places"],
  });

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "in" },
      types: ["address", "establishment"],
    },
    debounce: 300,
    cache: 24 * 60 * 60,
    initOnMount: true,
  });

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    try {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setMarkerPosition({ lat, lng });

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`;
      const response = await fetch(geocodeUrl);
      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      const address = data.results[0]?.formatted_address || "Unknown Location";
      setSelectedLocation(address);
      setValue(address, false);
      toast.success(`Location selected: ${address}`);
    } catch (error) {
      console.error("Error fetching geocode data:", error);
      toast.error("Unable to fetch location. Please try again.");
    }
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setMarkerPosition({ lat, lng });
      setSelectedLocation(address);

      // Pan map to the selected location
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }

      toast.success("Location selected successfully!");
    } catch (error) {
      console.error("Error: ", error);
      toast.error("Failed to select location. Please try again.");
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    try {
      const results = await getGeocode({
        address: value,
        componentRestrictions: { country: "in" },
      });
      const { lat, lng } = await getLatLng(results[0]);
      setMarkerPosition({ lat, lng });
      setSelectedLocation(value);

      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }

      toast.success("Location found successfully!");
    } catch (error) {
      console.error("Error: ", error);
      toast.error("Failed to find location. Please try again.");
    }
  };

  const handleAddLocation = () => {
    if (!selectedLocation) {
      toast.error("Please select a location first");
      return;
    }
    alert(`Location Added: ${selectedLocation}`);
  };

  const mapCenter = useMemo(
    () => ({ lat: 28.55708594953468, lng: 77.10011534431322 }),
    []
  );
  const mapRef = React.useRef<google.maps.Map | null>(null);

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#F96176]"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-[#F96176] to-purple-600">
            Add New Location
          </h1>
          <form onSubmit={handleSearchSubmit} className="relative w-1/3">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
              placeholder="Search for a location..."
              className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-gray-200 focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-200"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {status === "OK" && (
              <ul className="absolute z-50 w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-200">
                {data.map(({ place_id, description }) => (
                  <li
                    key={place_id}
                    onClick={() => handleSelect(description)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                  >
                    <FaMapMarkerAlt className="text-[#F96176] mr-2" />
                    {description}
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
          <div className="relative">
            <GoogleMap
              onClick={handleMapClick}
              onLoad={onMapLoad}
              center={markerPosition || mapCenter}
              zoom={12}
              mapContainerClassName="w-full h-[600px]"
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                styles: [
                  {
                    featureType: "all",
                    elementType: "geometry",
                    stylers: [{ saturation: -80 }],
                  },
                ],
              }}
            >
              {markerPosition && (
                <Marker
                  position={markerPosition}
                  animation={google.maps.Animation.DROP}
                />
              )}
            </GoogleMap>
          </div>

          <div className="p-8 space-y-6 bg-gradient-to-r from-pink-50 to-purple-50">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Selected Location
              </label>
              <input
                type="text"
                value={selectedLocation}
                readOnly
                className="w-full p-4 border-2 border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#F96176] focus:border-[#F96176] transition duration-200"
                placeholder="Click on the map or search to select a location"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddLocation}
                className="flex-1 bg-gradient-to-r from-[#F96176] to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:opacity-90 transform hover:scale-105 transition duration-200 shadow-lg"
              >
                Add Location
              </button>
              <button
                onClick={() => {
                  setMarkerPosition(null);
                  setSelectedLocation("");
                  setValue("");
                }}
                className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 font-bold transition duration-200 hover:border-[#F96176]"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLocation;
