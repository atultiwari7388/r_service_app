// pages/my-vehicles.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
// import Image from "next/image";
import Link from "next/link";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import PopupModal from "@/components/PopupModal";
import { Switch } from "@headlessui/react";
import toast from "react-hot-toast";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  image: string;
  active?: boolean;
  vehicleType: string;
}

interface UserData {
  role?: string;
}

interface RedirectProps {
  path: string;
}

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };
  const [showPopup, setShowPopup] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState("");

  // Sort vehicles alphabetically by vehicleNumber
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
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

    // Fetch user data to check role
    const userUnsubscribe = onSnapshot(doc(db, "Users", user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
        setRole((doc.data() as UserData).role || "");
      }
    });

    const vehiclesUnsubscribe = onSnapshot(
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

    return () => {
      userUnsubscribe();
      vehiclesUnsubscribe();
    };
  }, [user]);

  const handleRedirect = ({ path }: RedirectProps): void => {
    setShowPopup(false);
    window.location.href = path;
  };

  const handleToggleActive = async (vehicleId: string, newValue: boolean) => {
    if (!user) return;

    try {
      const batch = writeBatch(db);

      // 1. Update owner's vehicle
      const ownerVehicleRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
      batch.update(ownerVehicleRef, { active: newValue });

      // Update owner's DataServices
      const ownerDataServices = await getDocs(
        query(
          collection(db, "Users", user.uid, "DataServices"),
          where("vehicleId", "==", vehicleId)
        )
      );

      ownerDataServices.forEach((doc) => {
        batch.update(doc.ref, { active: newValue });
      });

      // 2. Check if owner has any team members
      const teamCheck = await getDocs(
        query(
          collection(db, "Users"),
          where("createdBy", "==", user.uid),
          where("isTeamMember", "==", true),
          limit(1)
        )
      );

      if (!teamCheck.empty) {
        // Owner has team members - get all members
        const teamMembers = await getDocs(
          query(
            collection(db, "Users"),
            where("createdBy", "==", user.uid),
            where("isTeamMember", "==", true)
          )
        );

        for (const member of teamMembers.docs) {
          const memberId = member.id;

          try {
            // Check if team member has this specific vehicle
            const memberVehicleRef = doc(
              db,
              "Users",
              memberId,
              "Vehicles",
              vehicleId
            );
            const memberVehicleDoc = await getDoc(memberVehicleRef);

            if (memberVehicleDoc.exists()) {
              // Only update if vehicle exists for team member
              batch.update(memberVehicleRef, { active: newValue });

              // Update team member's DataServices if they have any
              const memberDataServices = await getDocs(
                query(
                  collection(db, "Users", memberId, "DataServices"),
                  where("vehicleId", "==", vehicleId)
                )
              );

              memberDataServices.forEach((doc) => {
                batch.update(doc.ref, { active: newValue });
              });
            }
          } catch (e) {
            console.error(`Team member ${memberId} error:`, e);
            continue;
          }
        }
      }

      await batch.commit();
      toast.success("Vehicle status updated successfully");
    } catch (e) {
      console.error("Error updating vehicle status:", e);
      toast.error("Failed to update vehicle status");
      // Revert the UI state if the update fails
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, active: !newValue } : v))
      );
    }
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
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F96176] text-white">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Vehicle Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Vehicle Number
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Company Name
                </th>
                {userData?.role === "Owner" && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Active
                  </th>
                )}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-10 w-10">
                      {vehicle.vehicleType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.vehicleNumber || "Unknown Vehicle"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {vehicle.companyName || "Unknown Company"}
                    </div>
                  </td>
                  {userData?.role === "Owner" && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch
                        checked={vehicle.active || false}
                        onChange={(value) => {
                          // Optimistic UI update
                          setVehicles((prev) =>
                            prev.map((v) =>
                              v.id === vehicle.id ? { ...v, active: value } : v
                            )
                          );
                          handleToggleActive(vehicle.id, value);
                        }}
                        className={`${
                          vehicle.active ? "bg-[#F96176]" : "bg-gray-200"
                        }
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F96176]`}
                      >
                        <span
                          className={`${
                            vehicle.active ? "translate-x-6" : "translate-x-1"
                          }
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/account/my-vehicles/${vehicle.id}`}
                      className="text-[#F96176] hover:text-[#eb929e] mr-4"
                    >
                      View
                    </Link>
                    {role === "Owner" && (
                      <Link
                        href={`/account/my-vehicles/edit/${vehicle.id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    )}
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
