"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  image?: string;
  active?: boolean;
  type: string;
}

interface UserData {
  role?: string;
  displayName?: string;
}

export default function MemberVehiclePage() {
  const params = useParams();
  const memberId = params?.mId as string;

  const { user } = useAuth() || { user: null };
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const numA = a.vehicleNumber || "";
      const numB = b.vehicleNumber || "";
      return numA.localeCompare(numB);
    });
  }, [vehicles]);

  useEffect(() => {
    if (!memberId) {
      setError("Member ID not found");
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    let userUnsubscribe: () => void;
    let vehiclesUnsubscribe: () => void;

    try {
      // Fetch user data
      userUnsubscribe = onSnapshot(
        doc(db, "Users", memberId),
        (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          }
        },
        (err) => {
          console.error("Error fetching user data:", err);
          setError("Failed to load user information");
        }
      );

      // Fetch vehicles
      vehiclesUnsubscribe = onSnapshot(
        collection(doc(db, "Users", memberId), "Vehicles"),
        (snapshot) => {
          const vehiclesData: Vehicle[] = [];
          snapshot.forEach((doc) => {
            vehiclesData.push({ id: doc.id, ...doc.data() } as Vehicle);
          });
          setVehicles(vehiclesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error fetching vehicles: ", err);
          setError("Failed to load vehicles");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Initialization error:", err);
      setError("Failed to initialize data loading");
      setLoading(false);
    }

    return () => {
      userUnsubscribe?.();
      vehiclesUnsubscribe?.();
    };
  }, [memberId, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between w-full mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">
          {userData?.displayName
            ? `${userData.displayName}'s Vehicles`
            : "My Vehicles"}
        </h1>
      </div>

      {sortedVehicles.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No vehicles found</p>
          <p className="text-gray-400 mt-2">
            This member hasn&apos;t added any vehicles yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F96176] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Vehicle Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Vehicle Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Company Name
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {vehicle.type || "Truck"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {vehicle.vehicleNumber || "Unknown Vehicle"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {vehicle.companyName || "Unknown Company"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
