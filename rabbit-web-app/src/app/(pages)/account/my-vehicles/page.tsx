// pages/my-vehicles.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { LoadingIndicator } from "@/utils/LoadinIndicator";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  image: string;
}

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return; // Exit if user is not available
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-8">My Vehicles</h1>
      {vehicles.length === 0 ? (
        <p className="text-center text-gray-500">No vehicles found</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
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
                  {vehicle.companyName || "Unknown Vehicle"}
                </h2>
                <p className="text-gray-500">
                  {vehicle.vehicleNumber || "Unknown Number"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
