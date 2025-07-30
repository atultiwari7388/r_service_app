// "use client";

// import React, { useState, useMemo, useRef, useCallback } from "react";
// import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
// import { FaSearch, FaMapMarkerAlt, FaMapMarked } from "react-icons/fa";
// import usePlacesAutocomplete, {
//   getGeocode,
//   getLatLng,
// } from "use-places-autocomplete";
// import toast from "react-hot-toast";
// import {
//   collection,
//   doc,
//   writeBatch,
//   query,
//   getDocs,
// } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
// import { useRouter } from "next/navigation";

// const libraries: ["places"] = ["places"];

// const AddLocation = () => {
//   const [selectedLocation, setSelectedLocation] = useState("");
//   const [markerPosition, setMarkerPosition] =
//     useState<google.maps.LatLngLiteral | null>(null);
//   const { isLoaded, loadError } = useLoadScript({
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
//     libraries,
//   });
//   const router = useRouter();

//   const {
//     ready,
//     value,
//     suggestions: { status, data },
//     setValue,
//     clearSuggestions,
//   } = usePlacesAutocomplete({
//     requestOptions: {
//       types: ["geocode", "establishment"],
//     },
//     debounce: 300,
//     cache: 24 * 60 * 60,
//   });

//   const mapRef = useRef<google.maps.Map | null>(null);

//   const mapCenter = useMemo(
//     () => ({ lat: 28.55708594953468, lng: 77.10011534431322 }),
//     []
//   );

//   const onMapLoad = useCallback((map: google.maps.Map) => {
//     mapRef.current = map;
//   }, []);

//   const handleMapClick = async (event: google.maps.MapMouseEvent) => {
//     if (!event.latLng) return;

//     const lat = event.latLng.lat();
//     const lng = event.latLng.lng();
//     setMarkerPosition({ lat, lng });

//     try {
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
//       );

//       if (!response.ok) throw new Error("Failed to fetch address");

//       const data = await response.json();
//       const address = data.results[0]?.formatted_address || "Unknown Location";
//       setSelectedLocation(address);
//       setValue(address, false);
//       toast.success(`Location selected: ${address}`);
//     } catch (error) {
//       console.error("Error fetching address:", error);
//       toast.error("Failed to retrieve location. Please try again.");
//     }
//   };

//   const handleSelect = async (address: string) => {
//     setValue(address, false);
//     clearSuggestions();

//     try {
//       const results = await getGeocode({ address });
//       const { lat, lng } = await getLatLng(results[0]);
//       setMarkerPosition({ lat, lng });
//       setSelectedLocation(address);

//       if (mapRef.current) {
//         mapRef.current.panTo({ lat, lng });
//         mapRef.current.setZoom(15);
//       }
//     } catch (error) {
//       console.error("Error selecting location:", error);
//       toast.error("Failed to select location. Please try again.");
//     }
//   };

//   const handleSearchSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!value) return;

//     try {
//       const results = await getGeocode({ address: value });
//       const { lat, lng } = await getLatLng(results[0]);
//       setMarkerPosition({ lat, lng });
//       setSelectedLocation(value);

//       if (mapRef.current) {
//         mapRef.current.panTo({ lat, lng });
//         mapRef.current.setZoom(15);
//       }

//       toast.success("Location found successfully!");
//     } catch (error) {
//       console.error("Error finding location:", error);
//       toast.error("Unable to locate. Please refine your search.");
//     }
//   };

//   const handleAddLocation = async () => {
//     if (!selectedLocation || !markerPosition) {
//       toast.error("Please select a location first");
//       return;
//     }

//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         toast.error("Please login first");
//         return;
//       }

//       const batch = writeBatch(db);
//       const userAddressesRef = collection(db, "Users", user.uid, "Addresses");

//       const existingAddresses = await getDocs(query(userAddressesRef));
//       existingAddresses.forEach((doc) => {
//         batch.update(doc.ref, { isAddressSelected: false });
//       });

//       const newAddressRef = doc(userAddressesRef);
//       batch.set(newAddressRef, {
//         address: selectedLocation,
//         addressType: "Home",
//         date: new Date().toISOString(),
//         id: newAddressRef.id,
//         isAddressSelected: true,
//         location: {
//           latitude: markerPosition.lat,
//           longitude: markerPosition.lng,
//         },
//       });

//       await batch.commit();
//       toast.success("Location added successfully!");
//       setMarkerPosition(null);
//       setSelectedLocation("");
//       setValue("");
//       //redirect to home page
//       router.push("/");
//     } catch (error) {
//       console.error("Error adding location:", error);
//       toast.error("Failed to add location. Please try again.");
//     }
//   };

//   if (loadError) {
//     return <div>Error loading Google Maps. Please try again later.</div>;
//   }

//   if (!isLoaded) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-pulse text-xl font-semibold">
//           Loading Maps...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
//       <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
//         <h1 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
//           <FaMapMarked className="mr-2 text-[#F96176]" />
//           Add New Location
//         </h1>

//         <div className="mb-6">
//           <form onSubmit={handleSearchSubmit} className="relative">
//             <input
//               value={value}
//               onChange={(e) => setValue(e.target.value)}
//               disabled={!ready}
//               placeholder="Search for a location..."
//               className="w-full px-12 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F96176] focus:outline-none transition-colors"
//             />
//             <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
//             {status === "OK" && (
//               <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-2 max-h-60 overflow-y-auto">
//                 {data.map(({ place_id, description }) => (
//                   <li
//                     key={place_id}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleSelect(description);
//                     }}
//                     className="p-3 flex items-center hover:bg-blue-50 cursor-pointer transition-colors"
//                   >
//                     <FaMapMarkerAlt className="mr-3 text-[#F96176]" />
//                     {description}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </form>
//         </div>

//         {selectedLocation && (
//           <div className="mb-6 p-4 bg-blue-50 rounded-lg">
//             <h2 className="font-semibold text-gray-700 mb-2">
//               Selected Location:
//             </h2>
//             <p className="text-[#F96176] flex items-center">
//               <FaMapMarkerAlt className="mr-2" />
//               {selectedLocation}
//             </p>
//           </div>
//         )}

//         <div className="rounded-lg overflow-hidden shadow-lg mb-6">
//           <GoogleMap
//             onClick={handleMapClick}
//             onLoad={onMapLoad}
//             center={markerPosition || mapCenter}
//             zoom={12}
//             mapContainerStyle={{ height: "500px", width: "100%" }}
//             options={{
//               streetViewControl: false,
//               mapTypeControl: false,
//               fullscreenControl: true,
//               zoomControl: true,
//             }}
//           >
//             {markerPosition && (
//               <Marker
//                 position={markerPosition}
//                 animation={google.maps.Animation.DROP}
//               />
//             )}
//           </GoogleMap>
//         </div>

//         <div className="flex justify-center">
//           <button
//             onClick={handleAddLocation}
//             className="px-8 py-3 bg-[#F96176] text-white rounded-lg hover:bg-[#F96176] transition-colors duration-200 flex items-center font-semibold"
//             disabled={!selectedLocation}
//           >
//             <FaMapMarkerAlt className="mr-2" />
//             Save Location
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddLocation;
"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { FaSearch, FaMapMarkerAlt, FaMapMarked } from "react-icons/fa";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import toast from "react-hot-toast";
import {
  collection,
  doc,
  writeBatch,
  query,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const libraries: ["places"] = ["places"];

const AddLocation = () => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);

  const router = useRouter();
  const mapRef = useRef<google.maps.Map | null>(null);

  const mapCenter = useMemo(
    () => ({ lat: 28.55708594953468, lng: 77.10011534431322 }),
    []
  );

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    libraries,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
      );

      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      const address = data.results[0]?.formatted_address || "Unknown Location";
      setSelectedLocation(address);
      toast.success(`Location selected: ${address}`);
    } catch (error) {
      console.error("Error fetching address:", error);
      toast.error("Failed to retrieve location. Please try again.");
    }
  };

  const handleAddLocation = async () => {
    if (!selectedLocation || !markerPosition) {
      toast.error("Please select a location first");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please login first");
        return;
      }

      const batch = writeBatch(db);
      const userAddressesRef = collection(db, "Users", user.uid, "Addresses");

      const existingAddresses = await getDocs(query(userAddressesRef));
      existingAddresses.forEach((doc) => {
        batch.update(doc.ref, { isAddressSelected: false });
      });

      const newAddressRef = doc(userAddressesRef);
      batch.set(newAddressRef, {
        address: selectedLocation,
        addressType: "Home",
        date: new Date().toISOString(),
        id: newAddressRef.id,
        isAddressSelected: true,
        location: {
          latitude: markerPosition.lat,
          longitude: markerPosition.lng,
        },
      });

      await batch.commit();
      toast.success("Location added successfully!");
      setMarkerPosition(null);
      setSelectedLocation("");
      router.push("/");
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location. Please try again.");
    }
  };

  if (loadError) {
    return <div>Error loading Google Maps. Please try again later.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-xl font-semibold">
          Loading Maps...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <FaMapMarked className="mr-2 text-[#F96176]" />
          Add New Location
        </h1>

        <SearchBox
          mapRef={mapRef}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          markerPosition={markerPosition}
          setMarkerPosition={setMarkerPosition}
        />

        {selectedLocation && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-gray-700 mb-2">
              Selected Location:
            </h2>
            <p className="text-[#F96176] flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              {selectedLocation}
            </p>
          </div>
        )}

        <div className="rounded-lg overflow-hidden shadow-lg mb-6">
          <GoogleMap
            onClick={handleMapClick}
            onLoad={onMapLoad}
            center={markerPosition || mapCenter}
            zoom={12}
            mapContainerStyle={{ height: "500px", width: "100%" }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
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
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAddLocation}
            className="px-8 py-3 bg-[#F96176] text-white rounded-lg hover:bg-[#F96176] transition-colors duration-200 flex items-center font-semibold"
            disabled={!selectedLocation}
          >
            <FaMapMarkerAlt className="mr-2" />
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocation;

const SearchBox = ({
  mapRef,
  setSelectedLocation,
  setMarkerPosition,
}: {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  markerPosition: google.maps.LatLngLiteral | null;
  setMarkerPosition: (val: google.maps.LatLngLiteral) => void;
}) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ["geocode", "establishment"],
    },
    debounce: 300,
    cache: 24 * 60 * 60,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setMarkerPosition({ lat, lng });
      setSelectedLocation(address);

      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }
    } catch (error) {
      console.error("Error selecting location:", error);
      toast.error("Failed to select location. Please try again.");
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    try {
      const results = await getGeocode({ address: value });
      const { lat, lng } = await getLatLng(results[0]);
      setMarkerPosition({ lat, lng });
      setSelectedLocation(value);

      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }

      toast.success("Location found successfully!");
    } catch (error) {
      console.error("Error finding location:", error);
      toast.error("Unable to locate. Please refine your search.");
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative mb-6">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search for a location..."
        className="w-full px-12 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F96176] focus:outline-none transition-colors"
      />
      <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
      {status === "OK" && (
        <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-2 max-h-60 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(description);
              }}
              className="p-3 flex items-center hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <FaMapMarkerAlt className="mr-3 text-[#F96176]" />
              {description}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};
