// pages/my-vehicles.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import PopupModal from "@/components/PopupModal";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  image: string;
}

interface RedirectProps {
  path: string;
}

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };
  const [showPopup, setShowPopup] = useState(false);

  // Sort vehicles alphabetically by vehicleNumber
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      // Handle cases where vehicleNumber might be undefined
      const numA = a.vehicleNumber || "";
      const numB = b.vehicleNumber || "";
      return numA.localeCompare(numB);
    });
  }, [vehicles]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(doc(db, "Users", user.uid), "Vehicles"),
      (snapshot) => {
        const vehiclesData: Vehicle[] = [];
        snapshot.forEach((doc) => {
          vehiclesData.push({ id: doc.id, ...doc.data() } as Vehicle);
        });
        setVehicles(vehiclesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching vehicles: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleRedirect = ({ path }: RedirectProps): void => {
    setShowPopup(false);
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Row with Flexbox */}
      <div className="flex items-center justify-between w-full mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">My Vehicles</h1>
        <button
          className="btn bg-[#F96176] text-white text-lg px-5 py-2 rounded-md hover:bg-[#eb929e] transition"
          title="Add Vehicle"
          onClick={(e) => {
            e.preventDefault();
            setShowPopup(true);
          }}
        >
          Add Vehicle
        </button>
      </div>

      {/* Reusable Popup Component */}
      <PopupModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title="Select Option"
        options={[
          {
            label: "Add Vehicle",
            onClick: () => handleRedirect({ path: "/add-vehicle" }),
          },
          {
            label: "Import Vehicle",
            onClick: () => handleRedirect({ path: "/import-vehicle" }),
            bgColor: "blue",
          },
        ]}
      />

      {sortedVehicles.length === 0 ? (
        <p className="text-center text-gray-500">No vehicles found</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedVehicles.map((vehicle) => (
            <Link
              href={`/account/my-vehicles/${vehicle.id}`}
              key={vehicle.id}
              className="border rounded-lg shadow-lg p-4 flex flex-col items-center hover:shadow-xl transition-shadow duration-300 bg-white"
            >
              <Image
                src={vehicle.image || "/Logo_Login.png"}
                alt={vehicle.companyName}
                width={100}
                height={100}
                className="rounded-full mb-4"
              />
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-1">
                  {vehicle.vehicleNumber || "Unknown Vehicle"}
                </h2>
                <p className="text-gray-500">
                  {vehicle.companyName || "Unknown Number"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
